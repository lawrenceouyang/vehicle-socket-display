//React
import React from "react"
//Material UI
import {Card, CardActions, CardHeader, CardMedia, CardTitle, CardText} from 'material-ui/Card';
import {RadioButton, RadioButtonGroup} from 'material-ui/RadioButton';
import {Step, Stepper, StepLabel,} from 'material-ui/Stepper';
import Subheader from 'material-ui/Subheader';
import AutoComplete from 'material-ui/AutoComplete';
import {List, ListItem} from 'material-ui/List';
import CircularProgress from 'material-ui/CircularProgress';
import MenuItem from 'material-ui/MenuItem';
// axios
import axios from "axios";
// components
import ErrorMessage from "../../components/error"


export default class VehicleSelector extends React.Component {

    // All the vehicles available under the search term
    constructor(props){
        super(props);
        this.state = {
            checkInListLoaded: false,
            vehicleListLoaded: false,
            vehicleList : [],
            checkInList: [],
            errorCode: ""
         };
    }

     componentDidMount(){
         this.getVehicleList();
         this.getCheckInList();
     }


    // Grab the vehicles matching the coordinator input
    getVehicleList = (value) => {
        var {vehicleListLoaded, vehicleList, errorCode} = this.state;
        // Run the ajax call
        axios.get('/coordinator/company/'+ this.props.selectedCompanyId + '/vehicles/')
          .then(res =>  {
            vehicleList=res.data.gtms_vehicles;
            // fix the bug for autocomplete which does not look up numbers
            for (var vehicle in vehicleList) {
               for(var key in vehicleList[vehicle]){
                    if (vehicleList[vehicle].hasOwnProperty(key))
                    {
                        vehicleList[vehicle][key] = String(vehicleList[vehicle][key]);
                    }
             }
            }
            // Bug is fixed -- to do remove on the later version once the issue is resolved
            vehicleListLoaded=true;
            this.setState({vehicleList,vehicleListLoaded});
          })
          .catch(res => {
                errorCode = res.status + "";
                this.setState({errorCode});
          });
    };


    // Grab the Vehicles that have been checked in
    getCheckInList = (newVehicleIndex) => {
        var {checkInList,checkInListLoaded, errorCode} = this.state;
        // Run the ajax call
        axios.get('/coordinator/company/checkin/')
            .then(res => {
                checkInList=res.data.data;
                checkInListLoaded = true;
                this.setState({checkInList, checkInListLoaded});
            })
            .catch(res=>{
                errorCode = res.status + "";
                this.setState({errorCode});
            });
    };

    getDropDownVehicleList = () => {

        var {vehicleList, checkInList}= this.state;
        var {selectedCompanyId} = this.props;
        var dropDownList = [];
        for (var vehicle in vehicleList){
            var found = false;
            for (var checkin in checkInList){
                if (checkInList[checkin]["company"]["company_id"]== selectedCompanyId
                    && checkInList[checkin]["vehicle_number"]== vehicleList[vehicle]["vehicle_number"]){
                    found=true;
                }
            }
            if (!found) {
                dropDownList.push(vehicleList[vehicle]);
            }
            else{
                var vehicle_number = vehicleList[vehicle]["vehicle_number"];
                vehicleList[vehicle]["vehicle_number"]= vehicle_number ;
                vehicleList[vehicle]["vehicle_id"]= (<MenuItem  disabled={true} primaryText={vehicle_number+ " - Checked In!"}/>);
                dropDownList.push(vehicleList[vehicle]);
            }
        }

        return dropDownList;

    };


    // Set the vehicle Number to the parent
    setVehicle = (chosenRequest, index) =>{
        this.props.setVehicle(chosenRequest);
    };

    resetVehicle = (searchText, dataSource, params) => {
        this.props.setVehicle("");
    };

    render(){
        const style = {
            subHeaderStyle:{
                paddingLeft:0,
                lineHeight:"68px",
                marginTop:-20}
        };
        const dataSourceConfig = {
              text: 'vehicle_number',
              value: 'vehicle_id',
            };
        var {vehicleListLoaded, checkInListLoaded, errorCode} = this.state;
        return(
            <div>
                {checkInListLoaded && vehicleListLoaded  &&
                <div>
                <Subheader style={style.subHeaderStyle}>
                    Please Enter and Select a Valid Vehicle Number
                </Subheader>
                    <AutoComplete
                        hintText="Vehicle Numbers"
                        dataSource={this.getDropDownVehicleList()}
                        dataSourceConfig={dataSourceConfig}
                        searchText={this.props.selectedVehicle.vehicle_number}
                        onNewRequest={this.setVehicle}
                        onUpdateInput={this.resetVehicle}
                    />
                </div>
                }
                {!(vehicleListLoaded && checkInListLoaded) && errorCode=="" &&
                    <div class="loader"><CircularProgress/></div>
                }
                {errorCode!="" &&  <ErrorMessage errorCode={errorCode}/>}

            </div>
        )
    }
}