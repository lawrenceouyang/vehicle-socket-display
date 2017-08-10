//React
import React from "react"
import { connect } from "react-redux"
//React Router
import { Link } from "react-router";
// Material UI
import AppBar from 'material-ui/AppBar';
import Drawer from 'material-ui/Drawer';
import Menu from 'material-ui/Menu';
import MenuItem from 'material-ui/MenuItem';
import FontIcon from 'material-ui/FontIcon';
import IconButton from 'material-ui/IconButton';
import Divider from 'material-ui/Divider';
import FlatButton from 'material-ui/FlatButton';
import Dialog from 'material-ui/Dialog';

export default class Layout extends React.Component {

     /*************************************************************************************
     * Constructor to set the initial state of the checkin summary component
     * @param props
     * // State handles drawer width, and help popups
     *************************************************************************************/
    constructor(props){
        super(props);
        this.state = {drawer_width:65, mini_drawer:true, showHelpPopup: false};
    }

     /*************************************************************************************
     * Manage the state of the drawer
     *************************************************************************************/
    toggle_drawer(){
        this.state.mini_drawer ?
        this.setState({drawer_width:250, mini_drawer:false}) :
        this.setState({drawer_width:65, mini_drawer:true});
    }

    close_drawer = () => {
        this.setState({drawer_width:65, mini_drawer:true});
    };

    // Returns the content of the drawer
    get_drawer_menu(){
        var iconStyle = { color: "#888"};
        var selectedIconStyle = { color: "#333"};
        var selectedStyle = {color:"#333", fontWeight:"bold"};
        var {pathname} = this.props.location;
        return (
            <Menu value={pathname} selectedMenuItemStyle={selectedStyle} autoWidth={false} width="250px">
                <MenuItem primaryText="Check In" value="/"
                          leftIcon={ <FontIcon  style={pathname=="/" ? selectedIconStyle : iconStyle} className="material-icons">airport_shuttle</FontIcon>}
                          style={iconStyle}
                          containerElement={<Link to=""/>}
                          onTouchTap={this.close_drawer}
                />
                {this.props.route.role=="coordinator_admin" &&
                <MenuItem primaryText="Manage Users" value="/users"
                          leftIcon={ <FontIcon style={pathname=="/users" ? selectedIconStyle : iconStyle} className="material-icons">people</FontIcon>}
                          style={iconStyle}
                          containerElement={<Link to="/users"/>}
                          onTouchTap={this.close_drawer}
                />
                }
                <Divider style={{marginTop:200}}/>
                <MenuItem primaryText={this.props.route.username} value="/xyz"
                          leftIcon={ <FontIcon style={pathname=="/xyz" ? selectedIconStyle : iconStyle} className="material-icons">face</FontIcon>}
                          style={iconStyle}
                          containerElement={<Link to=""/>}
                          onTouchTap={this.close_drawer}
                />
                <MenuItem primaryText="Help" value="/help"
                          leftIcon={ <FontIcon style={pathname=="/help" ? selectedIconStyle : iconStyle} className="material-icons">help</FontIcon>}
                          style={iconStyle}
                          containerElement={<Link to=""/>}
                          onTouchTap={()=>this.setState({showHelpPopup:true}, ()=> this.close_drawer())}
                />
                <MenuItem primaryText="Logout" value="/logout"
                          leftIcon={ <FontIcon style={pathname=="/logout" ? selectedIconStyle : iconStyle} className="material-icons">exit_to_app</FontIcon>}
                          style={iconStyle}
                          href="/coordinator/logout/"
                          onTouchTap={this.close_drawer}
                />
            </Menu>
        )
    }

    // Returns the left and right icon appropriate to the page
    getDrawerIcon(direction){
        var pathname = this.props.location.pathname;
        //left element
        if (direction=="left"){
            if (pathname =='/'  || pathname=='/users' ){
            return  <IconButton iconClassName="material-icons">menu</IconButton>
            }
            else{
                return <IconButton iconClassName="material-icons">arrow_back</IconButton>
            }
        }
        // right element
        else {
             if (pathname =='/'){
            return  <IconButton iconClassName="material-icons"/>
            }
            else{
                return <IconButton iconClassName="material-icons"/>
            }
        }

    }

    // Action when the icons of drawers are clicked by the user
    getDrawerIconHandler = () =>{
        var pathname = this.props.location.pathname;
        if (pathname == '/' || pathname == '/users'){
            this.toggle_drawer();
        }
        else if ( pathname == '/users/add' || pathname.substr(0,11)=='/users/edit'){
             this.context.router.replace('/users');
        }
        else{
            this.context.router.replace('/');
        }
    };

    /*********************************************************************************************************
     * The best part of all, render function
     * This render function renders the app bar, drawer and content of the rest of the page
     *********************************************************************************************************/

    render() {

        // styles

        const mini_drawer_style = {
            position: 'absolute',
            top: '64px',
            height: 'calc(100% - 64px)',
            transition:"width 0.3s",
            boxShadow: "None",
            borderRight: "1px solid #eee",
            overflowX : "hidden",
            padding:0
        };

        const drawer_style = {
            position: 'absolute',
            top: '64px',
            height: 'calc(100% - 64px)',
            transition:"width 0.3s",
        };

        const overlay_style = { // need to fix this
            transition: 'left 0ms cubic-bezier(0.23, 1, 0.32, 1) 2s'
        };

        const container_style={
            marginLeft: '60px',
            height:'calc(100vh - 64px)',
            padding:'0px 5px 0px 5px',
            background: '#fff',
            border:'none'
        };
        const full_container_style={
            height:'calc(100vh - 64px)',
            background: '#fff',
            padding:'0',
            border:'none',
            marginLeft: '-5px',
            width: '100%'
        };

        var {mini_drawer,drawer_width}=this.state;
        var {location,children}=this.props;


        return(
            <div>

                {/** Always display the app bar **/}
                <AppBar title="Shared Ride Vans"
                        iconElementLeft={this.getDrawerIcon("left")}
                        iconElementRight={this.getDrawerIcon("right")}
                        onLeftIconButtonTouchTap={this.getDrawerIconHandler.bind(this)}
                        style={{boxShadow: "None",zIndex: 9999}}
                />

                {/** Display app bar with back button and no mini drawer for internal pages **/}
                {!(location.pathname=='/checkin' || location.pathname=='/users/add') &&
                    <Drawer
                        docked={mini_drawer}
                        width={drawer_width}
                        open={true}
                        onRequestChange={(open) => this.toggle_drawer()}
                        containerStyle={mini_drawer ? mini_drawer_style : drawer_style}
                        overlayStyle={overlay_style}>
                        {this.get_drawer_menu()}
                    </Drawer>
                }

                {/** Display app bar with menu button and drawer for external pages **/}
                {!(location.pathname=='/checkin' || location.pathname=='/users/add') ?
                    <div class="container-fluid" style={container_style}>
                        {children}
                    </div>
                    :
                    <div class="container-fluid" style={full_container_style}>
                        {children}
                    </div>
                }

                {/** Dialog for the help bar **/}
                <Dialog
                  title="Help!"
                  actions={<FlatButton
                            label="Ok"
                            primary={true}
                            onTouchTap={()=> this.setState({showHelpPopup:false})}
                            />}
                  modal={false}
                  open={this.state.showHelpPopup}
                  onRequestClose={()=> this.setState({showHelpPopup:false})}
                  contentStyle={{width:400}}>
                    <p>For all technical assistance contact SFO Helpdesk at sfohelpdesk@flysfo.com or 650.821.4357</p>
                </Dialog>

            </div>
        )
    }
}

// Required for routing to a different page from the current page
Layout.contextTypes={
    router: React.PropTypes.object.isRequired
};