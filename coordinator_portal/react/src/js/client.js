// React
import React from "react"
import ReactDOM from "react-dom"
//React Router
import {Router, Route, IndexRoute, hashHistory} from "react-router"
import CheckIn from "./pages/CheckIn"
import CheckInSummary from "./pages/checkInSummary"
import Layout from "./pages/Layout"
import ManageUser from "./pages/ManageUser"
import AddUser from "./pages/AddUser"
import EditUser from "./pages/EditUser"
//Redux
// Not implemented
// Material-UI Tap Event
import injectTapEventPlugin from 'react-tap-event-plugin';
injectTapEventPlugin();
// Material-UI Core
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import {lightBlue700, lightBlue500, grey400, amberA700, grey500, grey900} from 'material-ui/styles/colors';

/****************************************************************************
// This replaces the textColor value on the palette
// and then update the keys for each component that depends on it.
// More on Colors: http://www.material-ui.com/#/customization/colors
*****************************************************************************/

const muiTheme = getMuiTheme({
  fontFamily: 'Roboto, sans-serif',
  palette: {
    primary1Color: lightBlue700,
    primary2Color: lightBlue500,
    primary3Color: grey400,
    accent1Color: amberA700,
    accent2Color: amberA700,
    accent3Color: grey500,
    textColor: grey900
  }
});
/****************************************************************************
 // The main structure of the app as defined by react router
*****************************************************************************/

const app = document.getElementById('app');
const username = app.getAttribute("username");
const role = app.getAttribute("role");
const user_id = app.getAttribute("user-id");

ReactDOM.render(
	  				<MuiThemeProvider muiTheme={muiTheme}>
	  					<Router history={hashHistory}>
	  						<Route path='/' component={Layout} username={username} role={role}>
	  							<IndexRoute component={CheckInSummary}/>
	  							<Route path="users" component={ManageUser} user-id={user_id}/>
								<Route path="checkin" component={CheckIn}/>
								<Route path="users/add" component={AddUser}/>
								<Route path="users/edit/:user_id" component={EditUser}/>
	  						</Route>
  						</Router>
  					</MuiThemeProvider>
, app);
