const fetch = require('node-fetch');

function getLocation() {
    //console.log("GET LOCATION WAS CALLED!");
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition((position) => {
            resolve([position.coords.latitude, position.coords.longitude]);
        }, (err) => reject(err));
    });
}

async function getCurrentWeather(pos){
    const weatherResponse = await fetch(`http://api.openweathermap.org/data/2.5/weather?lat=${pos[0]}&lon=${pos[1]}&units=metric&appid=d8f1709ff6430946de83c76b1b89a30d`);
    const weatherObj = await weatherResponse.json();

    let temp;

    try{ temp = weatherObj.main.temp; }
    catch(err){ throw {weatherObj, err}; }

    return Math.round(temp);
}

class Weather{
    constructor(){
        this.location = null;
        this.temp = null;
        this.isUpdating = false;

        getLocation()
            .then(pos => {
                this.location = pos;
                return getCurrentWeather(pos);
            })
            .then(temp => {
                this.temp = temp;
            })
            .catch(err => console.error(err));
    }

    async updateTempAsync(){
        if(!this.isUpdating){
            this.isUpdating = true;

            if(!this.location) {
                try {
                    this.location = await getLocation();
                }
                catch (err) {
                    this.isUpdating = false;
                    throw  err;
                }
            }

            this.temp = await getCurrentWeather(this.location);
            this.isUpdating = false;
        }
    }

    updateTemp(){
        this.updateTempAsync().catch(err => console.error(err));
    }

    //returns temperature in Celcius or null
    getCurrentTemp(){
        // update (useful for future requests)
        this.updateTemp();

        //send the currentValue of temperature
        //probably not updated yet, but it's ok!
        return this.temp;
    }
}

module.exports = Weather;