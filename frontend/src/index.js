import React from "react";
import ReactDOM from "react-dom";
import CssBaseline from "@material-ui/core/CssBaseline";

import App from "./App";

ReactDOM.render(
	<CssBaseline>
		<App />
	</CssBaseline>,
	document.getElementById("root")
);

const registerServiceWorker = async () => {
	if ('serviceWorker' in navigator) {
	  try {
		const registration = await navigator.serviceWorker.register(
		  '/sw.js',
		  {
			scope: '/',
		  }
		);
		if (registration.installing) {
		  console.log('Service worker installing');
		} else if (registration.waiting) {
		  console.log('Service worker installed');
		} else if (registration.active) {
		  console.log('Service worker active');
		}
	  } catch (error) {
		console.error(`Registration failed with ${error}`);
	  }
	}
  };

  registerServiceWorker();

// ReactDOM.render(
// 	<React.StrictMode>
// 		<CssBaseline>
// 			<App />
// 		</CssBaseline>,
//   </React.StrictMode>

// 	document.getElementById("root")
// );
