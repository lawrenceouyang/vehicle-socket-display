//React
import React from "react"
import { Link } from "react-router";
// Flex box grid
import { Grid, Row, Col } from 'react-flexbox-grid/lib/index'
// Material UI
import {Card, CardActions, CardHeader, CardMedia, CardTitle, CardText} from 'material-ui/Card';
import FloatingActionButton from 'material-ui/FloatingActionButton';
import ContentAdd from 'material-ui/svg-icons/content/add';
import Snackbar from 'material-ui/Snackbar';
import RaisedButton from 'material-ui/RaisedButton'
import Divider from 'material-ui/Divider';
import FontIcon from 'material-ui/FontIcon';
import {List, ListItem} from 'material-ui/List';
import CircularProgress from 'material-ui/CircularProgress';
import Avatar from 'material-ui/Avatar';
import Subheader from 'material-ui/Subheader';
// Axios
import axios from "axios";
// Components
import ErrorMessage from "../components/error"
// helpers
import {formatAmPm} from "../helpers/helpers"


export default class CompanySummary extends React.Component {

    constructor(props){
        super(props);
        var snackBarMessage = (this.props.location.state==null ? "": this.props.location.state);
        this.state = {
            showSnackBar:this.props.location.state!=null,
            snackBarMessage: snackBarMessage,
            tripDestination: [],
            tripDestinationLoaded : false,
            errorCode: "",
        };
    }

    componentDidMount(){
        this.getDestination();
    }

    deNormalizeDestination(tripDestination) {
        var tempTripDestination = [];
        // Remove Duplicates
        for (var dst in tripDestination){
            var found = false;
            for(var t_dst in tempTripDestination){
                if (tempTripDestination[t_dst]["destination"]["destination_id"]==tripDestination[dst]["destination"]["destination_id"]){
                    found=true;
                }
            }
            if (!found){tempTripDestination.push(Object.assign(tripDestination[dst], {"count":0}))}
        }
        // Get Count and earliest time for each destination
        for(var t_dst in tempTripDestination){
            for (var dst in tripDestination){
                //check count
                if (tempTripDestination[t_dst].destination.destination_id==tripDestination[dst].destination.destination_id){
                    tempTripDestination[t_dst].count = tempTripDestination[t_dst].count + 1;
                }
                //check check in  time
                if (tempTripDestination[t_dst].checkin_at<tripDestination[dst].checkin_at){
                    tempTripDestination[t_dst].checkin_at = tripDestination[dst].checkin_at;
                }
            }
        }
        return tempTripDestination;
    }


    // Grab the Destinations for the company
    getDestination = () => {
        var {tripDestination,tripDestinationLoaded, errorCode} = this.state;
        // Run the ajax call
        axios.get('/company/available_destinations/')
            .then(res => {
                tripDestination = this.deNormalizeDestination(res.data.trip_destination);
                tripDestinationLoaded = true;
                this.setState({tripDestination, tripDestinationLoaded});
            })
            .catch(res=>{
                errorCode = res.status + "";
                if (res.status==401 && this.props.setLocked ) {
                    console.log(res);
                    this.props.setLocked(res.data.reason);
                }
                else{
                    this.setState({errorCode});
                }
            });
    };

    eachDestination =  (company_destination, index) => {
        return(
            <div key={index}>
            <ListItem innerDivStyle={{paddingLeft: 110}}
                      primaryText={<div style={{fontWeight:"bold"}}>{company_destination.destination.destination_name}</div>}
                      secondaryText={<span style={{fontStyle:"italic"}}>as of {formatAmPm(company_destination.checkin_at)}</span>}
                      leftAvatar={ <Avatar  color="#000" style={{left:"30px"}}
                                  backgroundColor={"rgba(255,255,255,0)"}
                                  size={40}>
                                  {<div style={{fontStyle: "italic", textAlign:"center", fontSize:"0.8em"}}>
                                    <span style={{fontWeight:"bold"}}>{company_destination.count} </span>
                                    <span>{company_destination.count>1 ? "Vehicles" : "Vehicle"}</span></div>}
                                  </Avatar>}/>
            <Divider inset={true} style={{marginLeft:"100px"}}/>
            </div>
        )
    };

    closeSnackBar = () =>{
        this.setState({showSnackBar:false});
        //this.state.props=null;
    };

    render() {
        //console.log("propsss", this.props, this.props.hello);
        var {tripDestination, tripDestinationLoaded, errorCode} = this.state;
        console.log(tripDestination);
        return(
            <Card style={{border:"none", boxShadow:"none", height:'calc(100vh - 200px)', position:"relative"}}>
                <Snackbar
                    open={this.state.showSnackBar}
                    message={this.state.snackBarMessage}
                    action="Success!"
                    autoHideDuration={5000}
                    onRequestClose={this.closeSnackBar}
                />
                {tripDestinationLoaded && tripDestination.length!=0 &&
                <div style={{position:"relative",height:'calc(100vh - 120px)', overflowY:'scroll'}}>
                    <List>
                        {tripDestination.map(this.eachDestination)}
                    </List>
                </div>}
                {tripDestinationLoaded && tripDestination.length==0 &&
                    <div style={{position:"relative",height:'calc(100vh - 120px)', overflowY:'scroll'}}>
                    <div class="center-message" style={{textAlign:"center"}}>
                        {<h4 style={{ fontWeight:"bold"}}>No Destinations Checked-In</h4>}
                    </div>
                    </div>}
                {!tripDestinationLoaded && errorCode=="" &&  <div class="loader" style={{bottom:"200px", top:"200px"}}><CircularProgress/></div>}
                {errorCode!="" && <ErrorMessage errorCode={errorCode}/>}
            </Card>
        )
    }
};