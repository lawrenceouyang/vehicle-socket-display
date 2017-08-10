//React
import React from "react"
//Material UI
import {Card, CardActions, CardHeader, CardMedia, CardTitle, CardText} from 'material-ui/Card';
import {RadioButton, RadioButtonGroup} from 'material-ui/RadioButton';
import {Step, Stepper, StepLabel, StepButton} from 'material-ui/Stepper';
import RaisedButton from 'material-ui/RaisedButton';
import FlatButton from 'material-ui/FlatButton';
import Dialog from 'material-ui/Dialog';
import {List, ListItem} from 'material-ui/List';
//Custom Components
import CompanyList from '../components/check-in/CompanyList'
import DestinationList from '../components/check-in/DestinationList'
import VehicleSelector from '../components/check-in/VehicleSelector'
import Summary from '../components/check-in/Summary'
// axios
import axios from "axios";



export default class CheckIn extends React.Component {

     /*************************************************************************************
     * Constructor to set the initial state of the checkin summary component
     * @param props
     * // State handles stepper index, error/message dialogs
     * // Upon Axios Calls Loaders and Error states are manipulated to show progress bars/errors
     * // Stepper has 4 component pages company, destinations, vehicles and summary
     *************************************************************************************/
     constructor(props) {
         super(props);
         this.state = {
             finished: false,
             stepIndex: 0,
             dialogOpen: false, // dialog for continuing without destination
             selectedCompanyId: null,
             selectedVehicle: {},
             selectedDestinations: []
         };
     }

    /******************************************************************************
        Callbacks to set company, vehicle and destination information
    ******************************************************************************/

    // Change the company information
    setCompany = (companyValue) => {
        var selectedCompanyId, selectedVehicle, selectedDestinations;
        selectedCompanyId = companyValue;
        selectedVehicle="";
        selectedDestinations=[];
        this.setState({selectedCompanyId, selectedVehicle, selectedDestinations});
    };

    // Set the vehicle to be checked in
    setVehicle = (vehicle) => {
        this.setState({selectedVehicle :vehicle});
    };


    // Returns Whether or not certain destinations are checked
    destinationIsChecked = (destination) => {
        var {selectedDestinations} = this.state;
        //return this.props.selectedDestinations.indexOf(destination) >= 0;
        for (var i = 0; i < selectedDestinations.length; i++) {
            if (selectedDestinations[i].destination.destination_id == destination.destination.destination_id) {
                return true;
            }
        }
        return false;
    };

    // Set the availability destinations
    setDestination = (destination) => {
        var {selectedDestinations} = this.state;
        if (this.destinationIsChecked(destination)){  // destination is selected
            for (var i=selectedDestinations.length-1; i>=0; i--) { // remove the destination from the list
                if (selectedDestinations[i].destination.destination_id == destination.destination.destination_id) {
                    selectedDestinations.splice(i, 1);
                }
            }
        }
        else { // add the destination to the list
            selectedDestinations.push(destination);
        }
        // update the state
        this.setState({selectedDestinations});
    };


    /******************************************************************************
                                Stepper Functions
     ******************************************************************************/
    // get step handler by page
    stepHandler = () => {
        var {stepIndex,selectedDestinations}=this.state;
            if (stepIndex==3){
                return this.handleFinish();
            }
            else if(stepIndex==2 && selectedDestinations.length==0){
                return this.handleDialogOpen();
             }
            else{
                return this.handleNext();
            }
    };

    // Next is pressed on the stepper
    handleNext = () => {
        const {stepIndex} = this.state;
        this.setState({
            stepIndex: stepIndex + 1,
            finished: stepIndex >= 3,
            dialogOpen: false
        });
    };

    // Previous is pressed on the stepper
    handlePrev = () => {
        const {stepIndex} = this.state;
        if (stepIndex > 0) {
            this.setState({stepIndex: stepIndex - 1});
        }
    };

    // Finish is pressed on the stepper
    handleFinish = () =>{
        var {selectedCompanyId, selectedVehicle,selectedDestinations}=this.state;
        var payload = {vehicle_id:selectedVehicle.vehicle_id,
              vehicle_number:selectedVehicle.vehicle_number,
              destination_list: selectedDestinations
            };
        axios.post('/coordinator/company/'+ selectedCompanyId + '/checkin/', payload // sends the server the checkin payload
            )
            .then(res=>{
                var message = "Vehicle #" + this.state.selectedVehicle.vehicle_number + " Successfully Checked In";
                this.context.router.replace({pathname:'/',state: message});
            })
            .catch(res=>{
                var message = "Vehicle #" + this.state.selectedVehicle.vehicle_number + " Could Not Be Checked In";
                this.context.router.replace({pathname:'/',state: message});
            });
    };

    // Close the dialog for continue without destination
    handleDialogClose =() =>{
        this.setState({dialogOpen:false});
    };

    // Open the dialog for continue without destination
    handleDialogOpen = () =>{
        this.setState({dialogOpen:true});
    };

    // The content of the stepper for each page
    getStepContent(stepIndex) {
        var {selectedCompanyId, selectedVehicle, selectedDestinations} = this.state;
        switch (stepIndex) {
            case 0:
                return (<CompanyList selectedCompanyId={selectedCompanyId}
                                     setCompany={this.setCompany}/>);
            case 1:
                return (<VehicleSelector selectedVehicle={selectedVehicle}
                                         selectedCompanyId={selectedCompanyId}
                                         setVehicle={this.setVehicle}/>);
            case 2:
                return (<DestinationList selectedDestinations={selectedDestinations}
                                         selectedCompanyId={selectedCompanyId}
                                         setDestination={this.setDestination}/>);
            case 3:
                return (<Summary selectedCompanyId={selectedCompanyId}
                                 selectedVehicle={selectedVehicle}
                                 selectedDestinations={selectedDestinations}/>);
            default:
                return 'Uh Oh Something is not right!';
        }
    };

    // The next button is disabled based on the logic on each page
    nextDisabled = (stepIndex) => {
        var {selectedCompanyId, selectedVehicle} = this.state;
        switch (stepIndex) {
            case 0:  // Must select a company from the check box
                return (selectedCompanyId==null);
            case 1:  // Selected Vehicle must be from the list of data source
                return (selectedVehicle=="" || selectedVehicle==null);
            default: // By default next button should not be disabled
                return false;
        }
    };

    /*********************************************************************************************************
     * The best part of all, render function
     * The checkin page renders a stepper and the componenets based on the page number from the check-in components
     *********************************************************************************************************/


    render() {
        const {stepIndex} = this.state;
        // Styles used for the stepper
        const style ={
            contentStyle:{
                padding:20,
                height:350,
                marginLeft:20},
            lowerButtonStyle:{
                marginRight: 12,
                marginLeft:20},
            cardStyle:{
                marginTop:-1,
                marginRight:-5,
                height: 'calc(100vh - 62px)'}
        };

        // Actions for the dialog box if no destination is selected!
         const actions = [
          <FlatButton
            label="Cancel"
            primary={true}
            onTouchTap={this.handleDialogClose}
          />,
          <FlatButton
            label="Continue"
            primary={true}
            keyboardFocused={true}
            onTouchTap={this.handleNext}
          />
        ];

        // Return the contents/logic of the stepper
        return (
            <Card style={style.cardStyle}>
                {/** Stepper **/}
                <Stepper activeStep={stepIndex}>
                    <Step>
                        <StepLabel>Company</StepLabel>
                    </Step>
                    <Step>
                        <StepLabel>Vehicle</StepLabel>
                    </Step>
                    <Step>
                        <StepLabel>Destinations</StepLabel>
                    </Step>
                    <Step>
                        <StepLabel>Confirmation</StepLabel>
                    </Step>
                </Stepper>

                {/** Content of the stepper **/}
                <div style={style.contentStyle}>
                    {this.getStepContent(stepIndex)}
                </div>

                {/** Back and Next buttons of the stepper **/}
                <div style={style.lowerButtonStyle}>
                    <FlatButton
                        label="Back"
                        disabled={stepIndex === 0}
                        onTouchTap={this.handlePrev}
                    />
                    <RaisedButton
                        label={stepIndex === 3 ? 'Check In' : 'Next'}
                        disabled={this.nextDisabled(stepIndex)}
                        backgroundColor="#0288D1" labelColor="#fff"
                        onTouchTap={this.stepHandler}
                    />
                </div>

                {/** Dialog if there are no destination selected **/}
                <Dialog
                  title="Continue Without Destination"
                  actions={actions}
                  modal={false}
                  open={this.state.dialogOpen}
                  onRequestClose={this.handleDialogClose}
                  contentStyle={{width:400}}>
                  This will mark the check-in as "Administrative Reason"
                </Dialog>

            </Card>
        );
    }

}

CheckIn.contextTypes={
    router: React.PropTypes.object.isRequired
};