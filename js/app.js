(function() {
    var circular = null;

    function rotateElement(element, rotateAngle) {
        element.style.transform = "rotate(" + rotateAngle + "deg)";
    }
    
    function getDate() {
        return typeof tizen != 'undefined' ? tizen.time.getCurrentDateTime() : new Date();
    }

    // Seconds are rotated by a CSS animtion, so set it to the initial
    // time
    rotateElement(
        document.querySelector("#time-second-indicator-outer"),
        getDate().getSeconds() * 6
    );
    /**
     * Updates the current time.
     * @private
     */
    function updateTime() {
        var dateTime = getDate();
        var second = dateTime.getSeconds(),
            minute = dateTime.getMinutes(),
            hour = dateTime.getHours(),
            elMinIndicator = document.querySelector("#time-min-indicator"),
            elHourIndicator = document.querySelector("#time-hour-indicator");
        rotateElement(elMinIndicator, (minute + (second / 60)) * 6);
        rotateElement(elHourIndicator, (hour + (minute / 60) + (second / 3600)) * 30);
    }

    function dateToRadians(d) {
        return (d.getHours() * 60 + d.getMinutes()) * 2 * Math.PI / 60 / 12;
    }

    function updateCalendar() {
        var xmlHttp = new XMLHttpRequest();

        xmlHttp.overrideMimeType("text/plain");
        xmlHttp.open("POST", "https://" + keys.server + "/cgi-bin/calexport.py?nocache=" + (+new Date()));
        xmlHttp.onreadystatechange = function() {
            if (xmlHttp.readyState != 4) return;
            if (xmlHttp.responseText) {
                var data = JSON.parse(xmlHttp.responseText);
                var segments = [];
                for (var i = 0; i < data.length; i++) {
                    var start = new Date(data[i][0]);
                    var duration = data[i][1];
                    // TODO fade out the colour if longer than 6 hours
                    // or if overlapping another event
                    if (duration <= 60 * 6) {
                        segments.push({
                            start: dateToRadians(start),
                            end: dateToRadians(new Date(+start + duration * 60000)),
                            colour: '#d23737',
                            startTick: true
                        });
                    }
                }
                circular.updateDisplay('appointments', segments);
            }
        };

        xmlHttp.send(keys.calendar);
    }

    function updateWeather() {
        var xmlHttp = new XMLHttpRequest();

        xmlHttp.open('GET', 'https://' + keys.server + '/cgi-bin/weather.py?nocache=' + (+new Date()));
        xmlHttp.onreadystatechange = function() {
            if (xmlHttp.readyState != 4) return;
            if (xmlHttp.responseText) {
                var now = new Date();
                var response = xmlHttp.responseText;
                var data = JSON.parse(response).hourly.data;
                var segments = [];
                for (var i = 0; i < data.length; i++) {
                    var dataDate = new Date(data[i].time * 1000);
                    if (dataDate > +now + 11 * 3600000) {
                        break;
                    }
                    var precip = data[i].precipProbability;
                    if (precip > .4) {
                        segments.push({
                            start: dateToRadians(new Date(+dataDate - 30 * 60000)),
                            end: dateToRadians(new Date(+dataDate + 30 * 60000)),
                            scale: .8,
                            colour: '#2334e2',
                            width: precip * .05
                        });
                    }
                }
                circular.updateDisplay('rain', segments);
            }
        };

        xmlHttp.send();
    }

    var updateTimer;
    /**
     * Updates the current month and date.
     * @private
     * @param {number} prevDate - The date of previous day
     */
    function updateDate(prevDate) {
        var dateTime = typeof tizen != 'undefined' ? tizen.time.getCurrentDateTime() : new Date();
        var month = dateTime.getMonth(),
            date = dateTime.getDate(),
            elMonthStr = document.querySelector("#calendar-weekday"),
            elDateStr = document.querySelector("#calendar-date"),
            nextInterval;

        if (prevDate !== null) {
            if (prevDate === date) {
                nextInterval = 1000;
            } else {
                nextInterval =
                    (23 - dateTime.getHours()) * 60 * 60 * 1000 +
                    (59 - dateTime.getMinutes()) * 60 * 1000 +
                    (59 - dateTime.getSeconds()) * 1000 +
                    (1000 - dateTime.getMilliseconds()) +
                    1;
            }
        }

        elMonthStr.innerHTML = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][dateTime.getDay()];
        elDateStr.innerHTML = date;

        if (updateTimer) {
            clearTimeout(updateTimer);
        }

        updateTimer = setTimeout(function() {
            updateDate(date);
        }, nextInterval);
    }

    var lastExchUpdate = 0;

    function updatePrice() {
        var now = +new Date();
        if (now < lastExchUpdate + 60)
            return;
        lastExchUpdate = now;
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.overrideMimeType("application/json");
        xmlHttp.open("GET", "https://min-api.cryptocompare.com/data/pricemulti?fsyms=BTC,ETH&tsyms=USD");
        xmlHttp.onreadystatechange = function() {
            if (xmlHttp.readyState != 4) return;
            if (xmlHttp.responseText) {
                var price = JSON.parse(xmlHttp.responseText).ETH.USD;
                document.querySelector('#price-text').innerHTML = price;
            }
        };

        xmlHttp.send();
    }

    function updateWatch() {
        updateDate();
        updateTime();
    }

    function updateInformation() {
        updatePrice();
        updateCalendar();
        updateWeather();
    }

    function bindEvents() {
        document.addEventListener("visibilitychange", function() {
            if (!document.hidden) {
                updateWatch();
                updateInformation();
            }
        });

        if (typeof tizen != 'undefined') {
            tizen.time.setTimezoneChangeListener(function() {
                updateWatch();
                updateInformation();
            });
        }
    }

    window.onload = function() {
        bindEvents();
        circular = new Circular("#appointments svg");
        updateWatch();
        updateInformation();
        setInterval(function() {
            updateTime();
        }, 1000);
        // Update everything every 30 minutes
        setInterval(function() {
            updateWatch();
            updateInformation();
        }, 1000 * 60 * 30);
    }
}());