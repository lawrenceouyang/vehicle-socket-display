//React
import React from "react"
import { connect } from "react-redux"
//React Router
import { Link } from "react-router";
// Material UI
import AppBar from 'material-ui/AppBar';
import MenuItem from 'material-ui/MenuItem';
import IconButton from 'material-ui/IconButton';
import IconMenu from 'material-ui/IconMenu';
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert';
import {Tabs, Tab} from 'material-ui/Tabs';
import FontIcon from 'material-ui/FontIcon';
import LockOutline from 'material-ui/svg-icons/action/lock-outline';
import RaisedButton from 'material-ui/RaisedButton';


// Axios
import axios from "axios";

export default class Layout extends React.Component {

    constructor(props){
        super(props);
        var tabValue;
        if(props.location.pathname=="/") {
            tabValue = "company"
        }
        else{
            tabValue = "check-in";
        }
        this.state = {
            tabValue: tabValue,
            companyName: "...",
            isLocked: false,
            lockedReason: ""
        };
    }

    // Runs before render
    componentWillMount() {
        var {companyName, dataLoaded} = this.state;
        // Run the ajax call
        axios.get('/company/info/')
            .then(res => {
                companyName = res.data.company[0]["display_name"];
                this.setState({companyName, dataLoaded});
            })
            .catch(res=>{
                console.log("Could not load the company name");
            });
    }

    setLocked = (reason) => {
        this.setState({isLocked:true, lockedReason: reason});
    };

    handleTabChange = (value) => {
        var {tabValue} = this.state;
        tabValue=value;
        if (value=="company"){
            this.context.router.replace({pathname:'/'});
        }
        else if (value=="check-in"){
            this.context.router.replace({pathname:'/manage'});
        }
        this.setState({tabValue});
    };

    render() {

        const container_style={
            padding:'0px 0px 0px 0px',
            background: '#fff',
            border:'none'
        };

        const iconButtonElement = (
            <IconButton touch={true}>
                <MoreVertIcon color={"#fff"} />
            </IconButton>
        );

        const rightIconMenu = (
            <IconMenu iconButtonElement={iconButtonElement}>
                <MenuItem href="/company/logout/">Logout</MenuItem>
            </IconMenu>
        );

        const refreshButtonElement =(
            <IconButton touch={true} onClick={()=>location.reload()}>
               <FontIcon className="material-icons" color={"#fff"}>cached</FontIcon>
            </IconButton>
        );

        const rightButtons = (
            <div>
                {refreshButtonElement}
                {rightIconMenu}
            </div>
        );

        var {children}=this.props;
        var {isLocked} = this.state;
        return(
            <div>
                {!isLocked &&
                <div>
                        <AppBar title={this.state.companyName}
                                iconElementLeft={<img src="/static/company_portal/img/sfo_logo.png" width="50" style={{marginTop:"10px"}}/>}
                                iconElementRight={rightButtons}
                                onLeftIconButtonTouchTap={()=>{}}
                                titleStyle={{textAlign:"center"}}
                                style={{boxShadow: "None", backgroundColor:"#005978"}}
                        />
                        <div class="container-fluid" style={container_style}>
                            <Tabs value={this.state.tabValue} onChange={this.handleTabChange}
                                  tabItemContainerStyle={{backgroundColor:"#005978"}}
                                  inkBarStyle={{backgroundColor:"#44acce"}}>
                                <Tab label="Destinations" value="company" >
                                  <div>
                                      {React.cloneElement(children, {setLocked: this.setLocked.bind(this)})}
                                  </div>
                                </Tab>
                                <Tab label="Settings" value="check-in">
                                  <div class="container-fluid">
                                     {React.cloneElement(children, {setLocked: this.setLocked.bind(this)})}
                                  </div>
                                </Tab>
                          </Tabs>
                        </div>
                 </div>}
                {isLocked &&
                    <div>
                        <div style={{height:"320px", "backgroundColor": "#ffa500", textAlign:"center"}} >
                            <LockOutline style={{color: "white", verticalAlign:"middle", height:"100px", width: "100px", marginTop: "50px"}}/>
                            <h1 style={{marginTop: "0px", lineHeight: "120px", color: "white", fontWeight: "bold"}}>
                                Account Locked
                            </h1>
                        </div>
                        <div style={{textAlign: "center", fontSize: "1.4em", padding:"20px"}}>
                            <br/>
                            {this.state.lockedReason!=null &&
                            <p>
                                You're seeing this message because SFO GTU has locked your company's
                                operation account for the following reason:
                            </p>
                            }
                            {this.state.lockedReason==null &&
                            <p>
                                You're seeing this message because SFO GTU has locked your account.
                            </p>
                            }
                            <p>
                                {this.state.lockedReason}
                            </p>
                            <p>
                                For questions concerning this lock, please contact SFO GTU at
                                650.821.6514
                            </p>
                            <br/>
                            <RaisedButton label="Logout" primary={true} href="/company/logout/"
                                          style={{width:"200px"}}
                                          labelStyle={{fontWeight:"bold", fontSize:"1em"}} />
                        </div>
                        <div>

                        </div>
                    </div>
                }
            </div>
        )
    }
}

Layout.contextTypes={
    router: React.PropTypes.object.isRequired
};