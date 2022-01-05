const exec    = require('child_process').exec;
const request = require('request');

var intervalId = null;

const HdmiOffCmd  = '/opt/vc/bin/tvservice -o';
const HdmiOnCmd   = '/opt/vc/bin/tvservice -p && sudo chvt 1 && sudo chvt 7';
const HdmiTimeout = 60000 * 5; // 5 Minutes

const homeassistantHost  = process.env.HA_HOST || null;
const homeassistantToken = process.env.HA_TOKEN || null;
const lightId  = process.env.HA_LIGHT_ID || null;

if (homeassistantHost === null) {
  console.error('HA_HOST not configured as environment variable');
  process.exit();
}

if (homeassistantToken === null) {
  console.error('HA_TOKEN not configured as environment variable');
  process.exit();
}

if (lightId === null) {
  console.error('HA_LIGHT_ID not configured as environment variable');
  process.exit();
}


//var api = new HueApi(HueHostname, HueUsername);

console.log('Checking for Light Id #' + lightId);
console.log('HDMI Port will be turned off after ' + Math.floor(HdmiTimeout / 60000) + ' Minutes');

checkForLightEverySecond();

// Check for the Status of the Light every second
function checkForLightEverySecond()
{
  intervalId = setInterval(turnHdmiOnIfLightIsOn, 1000);
}

function turnHdmiOnIfLightIsOn()
{
  console.log('Check if the Hue Light Id #' + lightId + ' is turned on ...');

  const httpOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + homeassistantToken,
    }    
  }

  request(homeassistantHost + '/api/states/' + lightId, httpOptions, function(error, response, body) {
    const light = JSON.parse(body);

    if (light.state == 'on') {
      turnHdmiOn();
    }
  });
  }

function turnHdmiOff()
{
  console.log('HDMI Port turned off');
  exec(HdmiOffCmd, function(error, stdout, stderr) {});

  // When the hdmi port is turned off we want to start
  // checking for the light again.
  checkForLightEverySecond();
}

function turnHdmiOn()
{
  console.log('HDMI Port turned on');
  exec(HdmiOnCmd, function(error, stdout, stderr) {});

  // Don't check for the light every second during it's on anyway
  clearInterval(intervalId);

  // Turn off the HDMI Port after the time given in "HdmiTimeout"
  HdmiTimeoutId = setTimeout(turnHdmiOff, HdmiTimeout);
}
