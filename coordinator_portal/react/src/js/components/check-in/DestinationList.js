//React
import React from "react"
import { connect } from "react-redux"
//Material UI
import {Card, CardActions, CardHeader, CardMedia, CardTitle, CardText} from 'material-ui/Card';
import {RadioButton, RadioButtonGroup} from 'material-ui/RadioButton';
import {Step, Stepper, StepLabel} from 'material-ui/Stepper';
import Subheader from 'material-ui/Subheader';
import {List, ListItem} from 'material-ui/List';
import Checkbox from 'material-ui/Checkbox';
import CircularProgress from 'material-ui/CircularProgress';
// axios
import axios from "axios";
// components
import ErrorMessage from "../../components/error"


export default class DestinationList extends React.Component {

    constructor(props){
        super(props);
        this.state = {
            loaded: false,
            destinationList : [],
            errorCode: ""
         };
    }

    componentDidMount(){
         this.getDestinationList();
     }

    // Grab the Destinations available to serve for the company
    getDestinationList = () => {
         var {loaded, destinationList, errorCode} = this.state;
        // Run the ajax call
        axios.get('/coordinator/company/'+ this.props.selectedCompanyId + '/destinations/')
          .then(res =>  {
            destinationList=res.data.company_destinations;
            loaded=true;
            errorCode = "";
            this.setState({destinationList, loaded});
          })
          .catch(res => {
                errorCode = res.status + "";
                this.setState({errorCode});
          });
    };

    // change fired when the checkboxes are un/checked
    handleChange = (label) => {
        this.props.setDestination(label);
    };

    // Returns Whether or not certain destinations are checked
    isChecked = (destination) => {
        var {selectedDestinations} = this.props;
        //return this.props.selectedDestinations.indexOf(destination) >= 0;
        var i;
        for (i = 0; i < selectedDestinations.length; i++) {
            if (selectedDestinations[i].destination.destination_id == destination.destination.destination_id) {
                return true;
            }
        }
        return false;
    };

     eachDestination = (value, index) => {
        const styles = {
            checkButton: {
                marginBottom: 16
            }
        };
        var {handleChange} = this;
        var {isChecked} = this;
        // Return every checkbox
        return(
            <Checkbox label={value.destination.destination_name} style={styles.checkButton} onCheck={()=>handleChange(value)}
                      checked={isChecked(value)} key={index}/>
        )
    };

    render() {
        const styles = {
            checkButton: {
                marginBottom: 16
            },
            subHeaderStyle:{
                paddingLeft:0,
                lineHeight:"68px",
                marginTop:-20
            }
        };
        var {loaded, destinationList, errorCode} = this.state;
        return (
            <div>
                {loaded &&
                <div>
                    <Subheader style={styles.subHeaderStyle}>Please select the destination(s)
                        this vehicle may serve
                    </Subheader>
                    <div>
                        {destinationList.map(this.eachDestination)}
                    </div>
                </div>
                }
                {!loaded && errorCode=="" &&
                    <div class="loader"><CircularProgress/></div>
                }
                {errorCode!="" &&  <ErrorMessage errorCode={errorCode}/>}
            </div>
        )
    }
}