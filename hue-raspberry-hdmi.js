var exec   = require('child_process').exec;
var HueApi = require("node-hue-api").HueApi;

var intervalId = null;

var HdmiOffCmd  = '/opt/vc/bin/tvservice -o';
var HdmiOnCmd   = '/opt/vc/bin/tvservice -p && sudo chvt 1 && sudo chvt 7';
var HdmiTimeout = 60000 * 5; // 5 Minutes
var HdmiTimeoutId = null;

var HueHostname = process.env.HUE_HOST;
var HueUsername = process.env.HUE_USER;
var HueLightId  = process.env.HUE_LIGHT_ID;

if (HueHostname.length == 0) {
  console.log('HUE_HOST not configured as environment variable');
  process.exit();
}

if (HueUsername.length == 0) {
  console.log('HUE_USER not configured as environment variable');
  process.exit();
}

var api = new HueApi(HueHostname, HueUsername);

console.log('Checking for Light Id #' + HueLightId);
console.log('HDMI Port will be turned off after ' + Math.floor(HdmiTimeout / 60000) + ' Minutes');

checkForLightEverySecond();

// Check for the Status of the Light every second
function checkForLightEverySecond()
{
  intervalId = setInterval(turnHdmiOnIfLightIsOn, 1000);
}

function turnHdmiOnIfLightIsOn()
{
  console.log('Check if the Hue Light Id #' + HueLightId + ' is turned on ...');
  api.lightStatus(HueLightId).then(checkLightStatus).done();
}

function checkLightStatus(status)
{
  if (status.state.on == true) {
    turnHdmiOn();
  }
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
