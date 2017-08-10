// React
import React from "react"
import ReactDOM from "react-dom"
//React Router
import {Router, Route, IndexRoute, hashHistory} from "react-router"
import CompanySummary from "./pages/CompanySummary"
import ManageCompany from "./pages/ManageCompany"
import Layout from "./pages/Layout"

// Material-UI Tap Event 
import injectTapEventPlugin from 'react-tap-event-plugin';
injectTapEventPlugin();
// Material-UI Core
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import {lightBlue700, lightBlue500, grey400, amberA700, grey500, grey900} from 'material-ui/styles/colors';


// This replaces the textColor value on the palette
// and then update the keys for each component that depends on it.
// More on Colors: http://www.material-ui.com/#/customization/colors
const muiTheme = getMuiTheme({
  fontFamily: 'Roboto, sans-serif',
  palette: {
    primary1Color: lightBlue700,
    primary2Color: lightBlue500,
    primary3Color: grey400,
    textColor: grey900
  }
});

const app = document.getElementById('app');
const username = app.getAttribute("username");
ReactDOM.render(
	  				<MuiThemeProvider muiTheme={muiTheme}>
	  					<Router history={hashHistory}>
	  						<Route path='/' component={Layout}>
	  							<IndexRoute component={CompanySummary}/>
								<Route path="manage" component={ManageCompany}/>
	  						</Route>
  						</Router>
  					</MuiThemeProvider>
, app);
