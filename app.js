
const atmo = {};

atmo.unsplashKey = "-yn3TSnS8fmd6m_Vl4i8pkMpz30rD3AFYZo23CGCKLE";
atmo.weatherKey = "76e02199a8d1ef08e9d324471a472dc3";

atmo.getWeather = (query) => {
    return $.ajax({
        url: "http://api.openweathermap.org/data/2.5/weather",
        method: "GET",
        dataType: "json",
        data: {
            appid: atmo.weatherKey,
            q: query
        }
    })
}

atmo.getBg = (query) => {
    return $.ajax({
        url: "https://api.unsplash.com/search/photos/",
        method: "GET",
        dataType: "json",
        data: {
            client_id: atmo.unsplashKey,
            orientation: "landscape",
            query: query
        }
    });
}

atmo.revealBg = (data) => {
    // unpack URL from Unsplash response and set page's background
    const url = data.results[0].urls.regular;
    $("body").css({
        "background-image": `url(${url})`
    })

    // hide overlay to reveal the background
    $('.userInput').hide();
    $('.overlay').hide();
}

atmo.showLocationInput = function () {
    $("#presetInputBtn").hide();
    $("#locationInputText").show();
    $("#locationInputSubmit").show();
    $(this).hide();
}

atmo.showPresetInput = function () {
    $("#locationInputBtn").hide();
    $("#presetInputMenu").show();
    $('option').show();
    $(this).hide();
}

atmo.hideOverlay = () => {
    $('.userInput').hide();
    $('.overlay').hide();
}

atmo.init = () => {
    // when user clicks on "Location" button, make location input form appear
    $("#locationInputBtn").on("click", atmo.showLocationInput);

    // when user clicks on "preset" button, make preset dropdown menu form appear
    $("#presetInputBtn").on("click", atmo.showPresetInput);

    // when user enters a location, pass location into getWeather
    $("#location").on("submit", function (e) {
        e.preventDefault();
        let userLocation = $("#locationInputText");
        atmo.getWeather(userLocation.val())
            .then(weatherData => weatherData.weather[0].description)
            .then(description => atmo.getBg(description))
            .then(res => atmo.revealBg(res));

        // clear the input text so box is empty on refresh
        userLocation.val("");
    });

    // when user chooses a preset, pass value to Unsplash API
    $("#preset").on("change", function (e) {
        e.preventDefault();
        const preset = $("#presetInputMenu").val();
        atmo.getBg(preset)
            .then(res => atmo.revealBg(res));
        
        // TODO: reset the dropdown box so dropdown shows instruction on refresh
    });
}

$(function () {
    atmo.init();
})