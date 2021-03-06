
const atmo = {};

atmo.unsplashKey = "-yn3TSnS8fmd6m_Vl4i8pkMpz30rD3AFYZo23CGCKLE";
atmo.weatherKey = "76e02199a8d1ef08e9d324471a472dc3";
atmo.geolocationKey = "59b86ae070e3453fb8d4ec8e88f4d2b4";

// capitalize the first letter of a string
atmo.capitalize = (string) => string.charAt(0).toUpperCase() + string.slice(1);

// switch between day/night mode
atmo.toggleNightMode = () => {
    // toggle fill of Font Awesome icons
    $(".modeButton i").toArray().forEach(icon => {
        if ($(icon).hasClass("fas")) {
            $(icon).removeClass("fas");
            $(icon).addClass("far");
        } else {
            $(icon).removeClass("far");
            $(icon).addClass("fas");
        }
    });

    // apply/remove nightMode style to all relevant commponents
    $(".modeButton, .overlay").toggleClass("nightMode");
}

atmo.getLocation = (query) => {
    return $.ajax({
        url: "https://api.opencagedata.com/geocode/v1/json",
        method: "GET",
        dataType: "json",
        data: {
            key: atmo.geolocationKey,
            q: query
        }
    })
}

atmo.getWeather = (lat, lng) => {
    return $.ajax({
        url: "http://api.openweathermap.org/data/2.5/weather",
        method: "GET",
        dataType: "json",
        data: {
            appid: atmo.weatherKey,
            lat: lat,
            lon: lng
        }
    })
}

atmo.getBg = (query) => {
    // determine screen size to search for either landscape or portrait
    let screenDir;
    if (window.innerHeight > window.innerWidth) screenDir = "portrait";
    else screenDir = "landscape";

    return $.ajax({
        url: "https://api.unsplash.com/search/photos/",
        method: "GET",
        dataType: "json",
        data: {
            client_id: atmo.unsplashKey,
            orientation: screenDir,
            query: query
        }
    });
}

atmo.setBg = (data) => {
    // randomize image returned from Unsplash
    const randomIndex = Math.floor(Math.random() * data.results.length);
    const image = data.results[randomIndex];
    const url = image.urls.regular;

    // set css before overlay is hidden
    $("body").css({
        "background-image": `url(${url})`,
        "color": image.color,
    })
    $("h1").css({
        "font-size": "2.5rem",
    });

    // set css for mobile view
    if (window.matchMedia("(max-width: 780px) and (min-width: 400px)").matches) {
        $("h1").css({
            "text-align": "left",
        });
    }

    $("#modeButton").fadeOut(500);

    // add description of bg image for screen readers
    const description = `<span class="srOnly">${image.alt_description}</span>`;
    $("main").append(description);
}

// define which components are visible at each app state
atmo.states = {
    welcome: {
        overlay: true,
        modeButton: true,
        preset: true,
        presetInputBtn: true,
        presetInputContainer: false,
        location: true,
        locationInputBtn: true,
        locationInputContainer: false,
        sidebar: false,
        weatherInfo: false,
    },
    inputLocation: {
        overlay: true,
        preset: false,
        locationInputBtn: false,
        locationInputContainer: true,
        sidebar: false,
        weatherInfo: false,
    },
    inputPreset: {
        overlay: true,
        presetInputBtn: false,
        presetInputContainer: true,
        location: false,
        sidebar: false,
        weatherInfo: false,
    },
    locationResult: {
        overlay: false,
        modeButton: false,
        preset: false,
        location: false,
        sidebar: true,
        weatherInfo: true,
    },
    presetResult: {
        overlay: false,
        modeButton: false,
        preset: false,
        location: false,
        sidebar: true,
        weatherInfo: false,
    }
}

// set the state of the app by hiding/showing app components
atmo.setState = (stateName, show) => {
    // assemble all components whose visibility must be changed
    const components = atmo.states[stateName];
    const keys = Object.keys(components);

    let time;
    if (stateName === "welcome") time = 0;
    else time = 500;

    // set the visibility of each compoennt's DOM node according to the boolean value
    $("form").fadeOut(500);
    window.setTimeout(() => {
        keys.forEach((key) => {
            const node = $(`#${key}`);

            if (components[key]) {
                node.removeClass("hidden");
            } else {
                node.addClass("hidden");
            }
            $(show).fadeIn(500);
        });
    }, time);
};

atmo.createWeatherDisplay = (weatherData) => {
    // create HTML string for weather icon
    const iconCode = weatherData.weather[0].icon;
    const description = weatherData.weather[0].description;
    const icon = `<img src="./assets/white/${iconCode}.png" alt="${description}">`;

    // create HTML string for weather text
    const temperature = Math.round(weatherData.main.temp - 273);
    const text = `<p id="tempMsg" class="temp">${temperature}&#176;C</p>`;

    // add elements to their container
    $("#weatherInfo").append(icon, text);
};

atmo.init = () => {

    // fade instructions in, and fade out after 3.5s
    $("main").hide().fadeIn(1000);
    window.setTimeout(() => {
        $("#instructions").fadeTo(1000, 0);
    }, 3500);

    // when user clicks on "Location" or "preset" button, make next form input appear
    $("#locationInputBtn, #presetInputBtn").on("click", function () {
        const id = $(this).parent()[0].id;
        const stateName = "input" + atmo.capitalize(id);
        atmo.setState(stateName, "#" + id);
    });

    // when user enters a location, pass location into getWeather
    $("#location").on("submit", (e) => {
        e.preventDefault();
        let userLocation = $("#locationInputText");
        const userCity = userLocation.val();
        $("#errMsg").empty();

        // request information about user's location from geolocation API
        atmo.getLocation(userCity)
            .then((res) => {
                // extract data from location response
                const country = res.results[0].components.country;
                const lat = res.results[0].geometry.lat;
                const lng = res.results[0].geometry.lng;

                // request weather from weather API
                const weatherResponse = atmo.getWeather(lat, lng);

                // when weather response arrives, request background image from photo API
                const imageResponse = weatherResponse.then((weatherData) => {
                    atmo.createWeatherDisplay(weatherData);
                    return atmo.getBg(`${weatherData.weather[0].description} ${country}`);
                })

                // return a Promise for the response holding the image data
                return imageResponse;
            })
            .then((res) => {
                // set and reveal the background image
                atmo.setBg(res);
                atmo.setState("locationResult", "main");
            })
            .fail(err => {
                let errMsg;
                // if user does not enter anything in the input
                if (userCity || userCity === "") errMsg = "Please enter your location";
                // if either geolocation API or weather API cannot return a response
                else if (err.status === 400) errMsg = "Could not find " + atmo.capitalize(userCity) + ". Please try again.";
                // all other errors (i.e., exceeded API limits)
                else errMsg = "Could not process your request. Please try again later.";
                $("#errMsg").text(errMsg);
            });

        // clear the input text so box is empty on refresh
        userLocation.val("");
    });

    // when user chooses a preset, pass value to Unsplash API
    $("#preset").on("change", (e) => {
        e.preventDefault();
        const preset = $("#presetInputMenu").val();
        atmo.getBg(preset)
            .then(res => atmo.setBg(res))
            .then(atmo.setState("presetResult", "main"));
    });

    // when user clicks shuffle icon, choose a random background using presets
    $("#shuffleIcon").on("click", () => {
        const optionArray = $("option").toArray();
        optionArray.shift();
        const presets = optionArray.map(el => el.value);
        const random = Math.floor(Math.random() * presets.length);
        atmo.getBg(presets[random])
            .then(res => atmo.setBg(res));
    })

    // return the user to the input selection screen
    $("#restartIcon").on("click", () => {
        atmo.setState("welcome", "form, #modeButton");

        // remove weather Info
        $("#weatherInfo").empty();

        // revert the dynamic style changes made by jQuery
        $("body, h1").removeAttr("style");
    })

    // listen for clicks on the day/night mode button
    $("#modeButton").on("click", atmo.toggleNightMode);
}

$(() => {
    atmo.init();
})