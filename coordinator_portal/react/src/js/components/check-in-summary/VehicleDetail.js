import React from 'react';
// material ui
import {List, ListItem} from 'material-ui/List';
import Divider from 'material-ui/Divider';
import {grey400, darkBlack, lightBlack} from 'material-ui/styles/colors';
import IconButton from 'material-ui/IconButton';
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert';
import CircularProgress from 'material-ui/CircularProgress';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';
import RaisedButton from 'material-ui/RaisedButton';
import Checkbox from 'material-ui/Checkbox';
import FlatButton from 'material-ui/FlatButton';
import Dialog from 'material-ui/Dialog';

// helpers
import {formatAmPm} from "../../helpers/helpers"

//axios
import axios from "axios";

// components
import ErrorMessage from "../../components/error"



export default class VehicleDetail extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            dialogLoaded: false,
            detailLoaded: false,
            availableDestinations: [],
            showEditDialog: false,
            showCheckOutDialog: false,
            showDeleteDialog: false,
            checkInDetail: null,
            checkOutDestinations: [],
            mainCheckOutDestination: null,
            editDestinations:[],
            checkIn: this.props.checkIn,
            errorCode: "",
            destinationAdjacency: {"san francisco":["marin", "san mateo", "san francisco"], "marin": ["san francisco", "marin"],
                                   "santa clara":["san mateo", "santa clara"], "san mateo": ["santa clara", "san mateo", "san francisco"],
                                   "alameda":["contra costa", "alameda"], "contra costa": ["alameda", "contra costa"]}
        };
    };

    componentDidMount(){
        this.setState({dialogLoaded:false, detailLoaded:false, mainCheckOutDestination: null,
            showCheckOutDialog:false, showEditDialog: false, availableDestinations:[], checkOutDestinations: [], checkInDetail: null,  editDestinations:[]
         }, ()=> {
                    this.getDestinationList();
                    this.getCheckInDetail();
                 });
    }

    componentWillReceiveProps(nextProps){
        // set the state, then update the destination and check in detail
        this.setState({checkIn:nextProps.checkIn, dialogLoaded:false, detailLoaded:false, mainCheckOutDestination:null,
            showCheckOutDialog:false, showEditDialog: false, availableDestinations:[], checkOutDestinations: [], checkInDetail: null,  editDestinations:[]
        }, ()=> {
                    this.getDestinationList();
                    this.getCheckInDetail();
                });
     };

    // Grab the Destinations available to serve for the company
    getDestinationList = () => {
         var {dialogLoaded, availableDestinations, checkIn, errorCode} = this.state;
        // Run the ajax call
        axios.get('/coordinator/company/'+ checkIn.company.company_id + '/destinations/')
          .then(res => {
            errorCode = "";
            availableDestinations=res.data.company_destinations;
            dialogLoaded=true;
            this.setState({availableDestinations, dialogLoaded});
          })
          .catch(res => {
                errorCode = res.status + "";
                this.setState({errorCode});
          });
    };

    // Grab the remaining detail of the vehicle
    getCheckInDetail(){
        var {checkIn, checkInDetail,detailLoaded, editDestinations, errorCode} = this.state;
         // Run the ajax call
        axios.get('/coordinator/company/'+ checkIn.company.company_id + '/vehicle/' + checkIn.vehicle_number + "/checkin_detail/")
          .then(res =>  {
            errorCode = "";
            checkInDetail=res.data.data;
            detailLoaded=true;
            for (var dst in checkInDetail.vehicle.destinations){
                editDestinations.push(checkInDetail.vehicle.destinations[dst]);
            }
            this.setState({checkInDetail, detailLoaded, editDestinations, errorCode});
          })
          .catch(res => {
                errorCode = res.status + "";
                this.setState({errorCode});

          });
    };

    isAdjacent = (mainDestination, subDestination) =>{
        var {destinationAdjacency, checkOutDestinations}= this.state;
        if (!mainDestination){
            return false;
        }
        var adjacencyList = destinationAdjacency[mainDestination.destination_name.toLowerCase()];
        var destinationName = subDestination.destination_name.toLowerCase();

        if (checkOutDestinations.length>1 && mainDestination.destination_name.toLowerCase()==destinationName){
            return true;
        }
        console.log(destinationName,adjacencyList.indexOf(destinationName));
        if (checkOutDestinations.length>=2 && checkOutDestinations.indexOf(subDestination)<0){
            return true;
        }
        if ( adjacencyList.indexOf(destinationName)>=0){
            return false;
        }
        return true;
    };

    handleCheckOutCheck = (destination) =>{
        var {checkOutDestinations, mainCheckOutDestination} = this.state;
        if(this.isChecked(destination)){
            for (var i=checkOutDestinations.length-1; i>=0; i--) { // remove the destination from the list
                if (checkOutDestinations[i].destination_id == destination.destination_id) {
                    checkOutDestinations.splice(i, 1);
                }
            }
        }
        else{
            checkOutDestinations.push(destination);
        }

        // adjacency list

        if (checkOutDestinations.length==0){
            mainCheckOutDestination=null;
        }
        else if(checkOutDestinations.length==1){
            mainCheckOutDestination=checkOutDestinations[0];
        }

        this.setState({checkOutDestinations, mainCheckOutDestination});
    };

        handleEditCheck = (destination) =>{
        var {editDestinations} = this.state;
        if(this.isCheckedForEdit(destination)){
            for (var i=editDestinations.length-1; i>=0; i--) { // remove the destination from the list
                if (editDestinations[i].destination_id == destination.destination_id) {
                    editDestinations.splice(i, 1);
                }
            }
        }
        else{
            editDestinations.push(destination);
        }
        this.setState({editDestinations});
    };


    isChecked = (destination) => {
        var {checkOutDestinations} = this.state;
        for (var dst in checkOutDestinations){
            if (checkOutDestinations[dst].destination_id == destination.destination_id){
                return true;
            }
        }
        return false;
    };

    isCheckedForEdit = (destination) => {
        var {editDestinations} = this.state;
        for (var dst in editDestinations){
            if ( editDestinations[dst].destination_id == destination.destination_id){
                return true;
            }
        }
        return false;
    };


    getVehicleLogo(companyName){
        switch(companyName) {
            case "Supershuttle Of San Francisco Inc":
                return "/static/coordinator_portal/img/supershuttle.png";
            case  "Lorrie's Travel & Tours":
                return "/static/coordinator_portal/img/golorries.jpeg";
            default:
                return ""
        }
    };

    eachCheckOutDestination = (destination, index) => {

        return <Checkbox
            label={destination.destination_name}
            onCheck={() => this.handleCheckOutCheck(destination)}
            checked= {this.isChecked(destination)}
            disabled= {this.isAdjacent(this.state.mainCheckOutDestination, destination)}
            key={index}/>;
    };

    eachAvailableDestination = (companyDestination, index) => {

        return <Checkbox
            label={companyDestination.destination.destination_name}
            onCheck={() => this.handleEditCheck(companyDestination.destination)}
            checked= {this.isCheckedForEdit(companyDestination.destination)}
            key={index}/>;
    };



    eachCheckedInDestination = (destination, index) => {

        if (index==0){
            return <span key={index}>{destination.destination_name}</span>;
        }
        else{
           return <span key={index}>, {destination.destination_name}</span>
        };
    };

    editDestinations(){
        
    }

    render(){
        var {checkOut,edit,deleteVehicle} = this.props;
        var {checkIn, detailLoaded, dialogLoaded, availableDestinations,
            showCheckOutDialog, showDeleteDialog, checkInDetail, checkOutDestinations, errorCode} = this.state;
        const iconButtonElement = (
            <IconButton touch={true}>
                <MoreVertIcon color={grey400} />
            </IconButton>
        );

        const rightIconMenu = (
            <IconMenu iconButtonElement={iconButtonElement} iconStyle={{height:45}}>
                <MenuItem onClick={() => this.setState({showEditDialog:true})}>Edit</MenuItem>
                <MenuItem onClick={() => this.setState({showDeleteDialog:true})}>Delete</MenuItem>
            </IconMenu>
        );

        var checkOutActions = [
          <FlatButton
            label="Cancel"
            primary={true}
            onTouchTap={()=> this.setState({showCheckOutDialog:false})}
          />,
          <FlatButton
            label="Checkout"
            primary={true}
            keyboardFocused={true}
            onTouchTap={() => checkOut(checkIn, this.state.checkOutDestinations)}
          />
        ];

        var editActions = [
          <FlatButton
            label="Cancel"
            primary={true}
            onTouchTap={()=> this.setState({showEditDialog:false})}
          />,
          <FlatButton
            label="Update"
            primary={true}
            keyboardFocused={true}
            onTouchTap={() => edit(checkIn, this.state.editDestinations)}
          />
        ];

        var deleteActions = [
          <FlatButton
            label="Cancel"
            primary={true}
            onTouchTap={()=> this.setState({showDeleteDialog:false})}
          />,
          <FlatButton
            label="Confirm"
            primary={true}
            keyboardFocused={true}
            onTouchTap={() => deleteVehicle(checkIn)}
          />
        ];
        return(
            <div style={{position:"relative"}}>

                {errorCode!="" && <ErrorMessage errorCode={errorCode}/>}

                { (checkIn!=null && detailLoaded==true) &&
                <List>
                    <ListItem style={{marginTop:28}}
                              primaryText={<h3>Vehicle #{checkIn.vehicle_number}</h3>}
                              rightIconButton={rightIconMenu}
                              hoverColor="#fff"
                    />
                    <Divider/>
                    {this.getVehicleLogo(checkIn.company.company_name)!=""?
                            <ListItem
                                primaryText={<p>Company<img src={this.getVehicleLogo(checkIn.company.company_name)} style={{float:"right", width: 150}}/></p>}
                                secondaryTextLines={1}
                            />:
                            <ListItem
                                primaryText={<p>Company Name <span style={{float:"right",  color:lightBlack}}>{checkIn.company.company_name}</span></p>}
                                secondaryTextLines={1}
                            />
                    }

                    <ListItem
                        primaryText={<p>Serving
                        <span style={{float:"right",  color:lightBlack}}>
                        {checkInDetail.vehicle.destinations.length >0 ?
                        checkInDetail.vehicle.destinations.map(this.eachCheckedInDestination)
                        :
                        "Administrative Reason"}
                        </span></p>}
                        secondaryTextLines={1}
                    />
                    <ListItem
                        primaryText={<p>License Plate <span style={{float:"right",  color:lightBlack}}>{checkInDetail.vehicle.license_plate}</span></p>}
                        secondaryTextLines={1}
                    />
                    <ListItem
                        primaryText={<p>Checked In At <span style={{float:"right",  color:lightBlack}}>{formatAmPm(checkInDetail.checkin_timestamp)}</span></p>}
                        secondaryTextLines={1}
                    />
                    <ListItem
                        primaryText={<p>Checked In By <span style={{float:"right",  color:lightBlack}}>{checkInDetail.checkin_by}</span></p>}
                        secondaryTextLines={1}
                    />
                    <RaisedButton label="Checkout" style={{marginLeft:16}} backgroundColor="#0288D1"
                                  labelColor="#fff" onClick={() => this.setState({showCheckOutDialog:true})}/>
                </List>
                }

                {!(checkIn!=null && detailLoaded==true) && errorCode=="" && <div class="loader" style={{marginTop:250}}><CircularProgress/></div>}

                { detailLoaded==true &&
                <div>
                <Dialog
                  title={checkInDetail.vehicle.destinations.length>0 ? "Select outbound locations:": "Checkout without destinations?" }
                  actions={checkOutActions}
                  modal={false}
                  open={this.state.showCheckOutDialog}
                  onRequestClose={()=> this.setState({showCheckOutDialog:false})}
                  contentStyle={{width:400}}>
                  {detailLoaded==true &&
                      <div>
                      {checkInDetail.vehicle.destinations.map(this.eachCheckOutDestination)}
                      <br/>
                      <p>* Only maximum of 2 adjacent destinations </p>
                      </div>
                  }
                  {errorCode=="" && !detailLoaded && <div class="loader"><CircularProgress/></div>}
                  {errorCode!="" && <ErrorMessage errorCode={errorCode}/>}
                </Dialog>

                <Dialog
                  title= "Are you sure?"
                  actions={deleteActions}
                  modal={false}
                  open={this.state.showDeleteDialog}
                  onRequestClose={()=> this.setState({showDeleteDialog:false})}
                  contentStyle={{width:400}}>
                  {dialogLoaded==true &&
                       "This will delete the check-in for vehicle #" + checkInDetail.vehicle.vehicle_number
                  }
                  {errorCode=="" && !detailLoaded && <div class="loader"><CircularProgress/></div>}
                  {errorCode!="" && <ErrorMessage errorCode={errorCode}/>}
                </Dialog>

                <Dialog
                  title="Edit check-in locations:"
                  actions={editActions}
                  modal={false}
                  open={this.state.showEditDialog}
                  onRequestClose={()=> this.setState({showEditDialog:false})}
                  contentStyle={{width:400}}>
                  {dialogLoaded==true &&
                      <div>
                          {availableDestinations.map(this.eachAvailableDestination)}
                          {this.state.editDestinations.length==0 && <div><br/><span>This will mark the check-in as "Administrative Reason"</span></div>}
                      </div>
                  }
                  {errorCode=="" && !detailLoaded && <div class="loader"><CircularProgress/></div>}
                  {errorCode!="" && <ErrorMessage errorCode={errorCode}/>}
                </Dialog>
                </div>
                }
                </div>
        )
    }
}


VehicleDetail.contextTypes={
    router: React.PropTypes.object.isRequired
};