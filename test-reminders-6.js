// Require the module
const iCloud = require('apple-icloud');

var username = "steve.willer@gmail.com"; // Your apple id
var password = "Aelee7d00dp!"; // Your password

// ...
// 'username' & 'password' are defined here...

// This creates your iCloud instance
var myCloud = new iCloud("icloud-session.json", username, password);

myCloud.on("ready", function() {
  console.log("Ready Event!");
  // Check if the two-factor-authentication is required
  if (myCloud.twoFactorAuthenticationIsRequired) {
    // Get the security code using node-prompt
    prompt.get(["Security Code"], async function(err, input) {
      if (err) return console.error(err);
      const code = input["Security Code"];
      // Set the security code to the instance
      myCloud.securityCode = code;
    });
  }
  else {
    // Now the 'ready' event fired but 'twoFactorAuthenticationIsRequired' is false, which means we don't need it (anymore)
    console.log("You are logged in completely!");
  }
});
