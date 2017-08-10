import React, {Component, PropTypes} from 'react';
import {List, ListItem, makeSelectable} from 'material-ui/List';
import Divider from 'material-ui/Divider';
import Subheader from 'material-ui/Subheader';
import Avatar from 'material-ui/Avatar';
import {lightBlack, black} from 'material-ui/styles/colors';
import SmartAvatar from "../../components/smartAvatar"
// helpers
import {formatAmPm} from "../../helpers/helpers"

export default class vehicleList extends React.Component {

    constructor(props) {
        super(props);
    }


    eachVehicle = (checkIn, index) => {
        return(
                <div key={index}>
                <ListItem key={index}
                          leftAvatar={
                          <SmartAvatar text={checkIn.company.display_name} table={false}/>
                          }
                          primaryText={<p>{checkIn.vehicle_number} <span style={{float:"right", color: lightBlack}}>{formatAmPm(checkIn.checkin_timestamp)}</span></p>}
                          secondaryText={<p><span style={{color:black}}>{checkIn.company.display_name}</span></p>}
                          secondaryTextLines={1}
                          onTouchTap={()=>this.props.updateSelectedVehicleIndex(index)}
                          style={index==this.props.selectedVehicleIndex?{backgroundColor:"#eee"}:{}}
                        />
                <Divider/>
                </div>
        )
    };

    render (){
        return(
              <div style={{position:'relative'}}>
                  <List>
                    <Subheader>CHECKED IN</Subheader>
                      {this.props.checkInList.map(this.eachVehicle)}
                  </List>
              </div>
            )
    }

}
