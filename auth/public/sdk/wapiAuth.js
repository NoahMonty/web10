//wapi can be double loaded. try locally first and if that fails, load from the cdn
if (typeof wapiAuthInit==='undefined'){


//Makes the wapiAuth library object
function wapiAuthInit(wapi) {
  const wapiAuth = {};

  //mints a second level token for the referrer site.
  wapiAuth.mintOAuthToken = function () {
    const referrerURL = new URL(document.referrer);
    wapi
      .getTieredToken(referrerURL.hostname, wapi.readToken().provider)
      .then(function (response) {
        wapiAuth.oAuthToken = response.data.token;
      })
      .catch(console.log);
  };

  //initialize the oauth token
  wapi.isSignedIn() ? wapiAuth.mintOAuthToken() : (wapiAuth.oAuthToken = null);

  //send the apikey back to the oauth requesting site
  wapiAuth.sendToken = function () {
    window.opener.postMessage(
      {
        type: "auth",
        token: wapiAuth.oAuthToken,
      },
      "*"
    );
    window.close();
  };

  //log into an existing web10 account
  //get tokens for web10 auth, and a parent oauth application.
  wapiAuth.logIn = function (provider, username, password, setAuth, setStatus) {
    //web10 auth login
    axios
      .post(`${provider}/web10token`, {
        username: username,
        password: password,
        token: null,
        site: window.location.hostname,
        target: null,
      })
      .then(function (response) {
        wapi.setToken(response.data.token);
        setAuth(true);
        wapiAuth.mintOAuthToken();
      })
      .catch((response) => setStatus(`log in failed ${response}`));
  };

  //sign up for a new web10 account
  wapiAuth.signUp = function (provider, username, password,betacode) {
    provider = new URL(provider);
    axios
      .post(`http://${provider.hostname}/signup`, {
        username: username,
        password: password,
        betacode: betacode
      })
      .then(console.log)
      .catch(console.log);
  };

  //change web10 username and password
  wapiAuth.changeUsername = function () {};
  wapiAuth.changePassword = function () {};

  //If there is a referrer, listen for the SMR and use it to set a web10 auth app state
  wapiAuth.SMRListen = function (setState) {
    if (window.opener) {
      window.addEventListener("message", function (e) {
        if (e.data.type === "smr") setState(e.data);
      });
      //Notify SMR requester that the auth app is ready.
      window.opener.postMessage(
        {
          type: "SMRListen",
        },
        "*"
      );
    }
  };

  //output the wapiAuth object
  return wapiAuth;
}
}