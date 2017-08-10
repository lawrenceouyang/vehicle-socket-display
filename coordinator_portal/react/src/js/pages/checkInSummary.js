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
import CircularProgress from 'material-ui/CircularProgress';
// Axios
import axios from "axios";
// Components
import VehicleList from "../components/check-in-summary/VehicleList"
import VehicleDetail from "../components/check-in-summary/VehicleDetail"
import ErrorMessage from "../components/error"
// helpers
import {compareTimestamp} from "../helpers/helpers"


export default class CheckInSummary extends React.Component {

    /*************************************************************************************
     * Constructor to set the initial state of the checkin summary component
     * @param props
     * // State handles snackbar visibility, scroll state for floating icon visibility
     * // Upon Axios Calls Loaders and Error states are manipulated to show progress bars/errors
     *************************************************************************************/
    constructor(props){
        super(props);
        var snackBarMessage = (this.props.location.state==null ? "": this.props.location.state);
        this.state = {
            showSnackBar:this.props.location.state!=null,
            snackBarMessage: snackBarMessage,
            selectedVehicleIndex: null,
            previousScroll:0,
            checkInList: [],
            checkInListLoaded : false,
            errorCode: "",
            floatingButtonStyle : {position:"fixed", zIndex: 99, right: '56%', bottom: '15px', transition: 'bottom 0.5s cubic-bezier(0.38,0.45,0,1.21)'}
        };
    }

    // When the component is finished mounting the checkin list is retrieved from the server
    componentDidMount(){
        this.getCheckInList(0); // The 0 indicates the default item that will be selected upon loading checkin list
    }
    
    // Grab the Vehicles that have been checked in from the server
    getCheckInList = (newVehicleIndex) => {
        if (newVehicleIndex < 0) newVehicleIndex=0;
        var {checkInList,selectedVehicleIndex,checkInListLoaded, errorCode} = this.state;
        // Run the ajax call
        axios.get('/coordinator/company/checkin/')
            .then(res => { // call was successful
                checkInList=res.data.data.sort(compareTimestamp); // sort the list by timestamp
                selectedVehicleIndex=newVehicleIndex;
                checkInListLoaded = true; // set the loaded to true so progress bar is removed
                this.setState({checkInList, selectedVehicleIndex, checkInListLoaded}); // re-render the page
            })
            .catch(res=>{
                errorCode = res.status + "";
                this.setState({errorCode});
            });
    };

    /*************************************************************************************
     * Actions Taken with each vehicle item in the list that has been checked in
     *************************************************************************************/

    // Action (1)
    // Change the current selected vehicle, this is done by changing the value of selectedVehicleIndex
    updateSelectedVehicleIndex = (index) => {
        this.setState({selectedVehicleIndex:index});
    };

    // Action (2)
    // Checkout the selected vehicle
    // CheckIn contains the checkin detail of the vehicle retrieved from the server
    // DestinationList is the list of destination chosen for purpose the checkout
    checkOut = (checkIn, destinationList) => {
        this.setState({checkInListLoaded:false});
        var {errorCode} = this.state;
        var payload={destination_list:destinationList,vehicle_number:checkIn.vehicle_number};
        // Run the ajax call
        axios.post('/coordinator/company/' + checkIn.company.company_id + '/checkout/', payload)
            .then(res=>{
                this.setState({showSnackBar:true, snackBarMessage: "Vehicle #" + checkIn.vehicle_number + " successfully checked out! "});
                this.getCheckInList(this.state.selectedVehicleIndex-1);
            })
            .catch(res => {
                errorCode = res.status + "";
                this.setState({errorCode});
            });
    };

    // Action (3)
    // edit the selected vehicle
    // CheckIn contains the checkin detail of the vehicle retrieved from the server
    // DestinationList is the list of destination chosen for purpose the editing
    edit = (checkIn, destinationList) => {
        this.setState({checkInListLoaded:false});
        var {errorCode} = this.state;
        var payload={destination_list:destinationList,vehicle_number:checkIn.vehicle_number};
        // Run the ajax call
        axios.post('/coordinator/company/' + checkIn.company.company_id + '/checkin/edit/', payload)
            .then(res=>{
                this.setState({showSnackBar:true, snackBarMessage: "Vehicle #" + checkIn.vehicle_number + " successfully Edited! "});
                this.getCheckInList(0);
            })
            .catch(res => {
                errorCode = res.status + "";
                this.setState({errorCode});
            });
    };

    // Action (4)
    // delete the selected vehicle
    // CheckIn contains the checkin detail of the vehicle retrieved from the server
    // No destinationList required for deleting vehilces
    deleteVehicle = (checkIn) => {
        this.setState({checkInListLoaded:false});
        var errorCode = this.state;
        var payload={vehicle_number:checkIn.vehicle_number};
        // Run the ajax call
        axios.post('/coordinator/company/' + checkIn.company.company_id + '/checkin/delete/', payload)
            .then(res=>{
                this.setState({showSnackBar:true, snackBarMessage: "Vehicle #" + checkIn.vehicle_number + " successfully Deleted! "});
                this.getCheckInList(this.state.selectedVehicleIndex-1);
            })
            .catch(res => {
                errorCode = res.status + "";
                this.setState({errorCode});
            });
    };

     /*************************************************************************************
     * Page Aesthetics Handlers
     *************************************************************************************/

    // Turn off the visibility of the current snackbar
    closeSnackBar = () =>{
        this.setState({showSnackBar:false});
    };

    // Control the style of the floating button (checkin button) based on the scroll value for the checkin list div
    handleScroll = () =>{
        var scrollIndex = document.getElementById("scroll").scrollTop;
        var {floatingButtonStyle,previousScroll} = this.state;
        if (previousScroll < scrollIndex) {
            floatingButtonStyle = {position:"fixed", zIndex: 99, right: '56%', bottom: '-70px', transition: 'bottom 0.5s cubic-bezier(0.38,0.45,0,1.21)'};
        }else{
            floatingButtonStyle = {position:"fixed", zIndex: 99, right: '56%', bottom: '15px', transition: 'bottom 0.5s  cubic-bezier(0.38,0.45,0,1.21)'};
        }
        previousScroll = scrollIndex;
        this.setState({floatingButtonStyle,previousScroll});
    };

     /*********************************************************************************************************
     * The best part of all, render function
     * This render function renders two columns one with checked in vehicle list, the other with vehicle detail
     * When no vehicles are checked in only one column is shown with "No Vehicles Checked In" Message
     *********************************************************************************************************/

    render() {
        // Style of the first column that contains the vehicle list
        const colStyle = {'border' : "1px solid #eee",
            'marginLeft': "-1px",
            'maxHeight':'calc(100vh - 62px)',
            "height": 'calc(100vh - 62px)',
            'overflowY': 'Scroll',
            'WebkitOverflowScrolling': 'touch',
            'padding' : '0'};

        // Style of the second column that contains the detail information of the checked in vehicle
        const colStyle2 = {
            'marginLeft': "-1px",
            'maxHeight':'calc(100vh - 62px)',
            "height": 'calc(100vh - 62px)',
            'overflowY': 'Scroll',
            'padding' : '0'};

        // Select vars from state using ES6
        var {selectedVehicleIndex, checkInList, checkInListLoaded, errorCode} = this.state;

        return(
            <Card style={{marginTop:-1, border:"none", boxShadow:"none"}}>

                {/** Display the progress bar if there are no errors and data hasn't loaded **/}
                {!checkInListLoaded && !errorCode && <div class="loader"><CircularProgress/></div>}

                {/** Display there is no checkin, if the list has loaded and contained no check-ins **/}
                {(checkInList.length == 0 && checkInListLoaded) &&
                <div class="center-message">
                    <h3 style={{textAlign:"center"}}> No Vehicles Checked In </h3>
                    <Link to="/checkin">
                        <RaisedButton label="CHECK IN" primary={true}
                                      style={{display: "block",margin: "0 auto",width:"100px"}}/>
                    </Link>
                </div>
                }

                {/** Display checkin/detail, if the list has loaded and contains check-ins **/}
                { (checkInList.length != 0 && checkInListLoaded) &&
                <div>
                    <Link to="/checkin">
                        <FloatingActionButton secondary={true} style={this.state.floatingButtonStyle}>
                            <ContentAdd />
                        </FloatingActionButton>
                    </Link>
                    <Row>
                        <Col xs={5} sm={5} md={5} lg={5} style={colStyle} onScroll={this.handleScroll} id="scroll">
                            <VehicleList checkInList={checkInList}
                                         selectedVehicleIndex={selectedVehicleIndex}
                                         updateSelectedVehicleIndex={this.updateSelectedVehicleIndex}/>
                        </Col>
                        <Col xs={7} sm={7} md={7} lg={7} style={colStyle2}>
                            <VehicleDetail checkIn={checkInList[selectedVehicleIndex]} checkOut={this.checkOut}
                                           edit={this.edit} deleteVehicle={this.deleteVehicle}/>
                        </Col>
                    </Row>
                </div>
                }

                {/** Display snack bar with the desired message sent from other components **/}
                <Snackbar
                    open={this.state.showSnackBar}
                    message={this.state.snackBarMessage}
                    action="Success!"
                    autoHideDuration={5000}
                    onRequestClose={this.closeSnackBar}
                />

                {/** If there is an error display the error message **/}
                {errorCode!="" && <ErrorMessage errorCode={errorCode}/>}
            </Card>
        )
    }
};