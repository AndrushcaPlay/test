import React from 'react';
import './App.css';
import Checkbox from '@material-ui/core/Checkbox';

export default class Item extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: '',
      checkbox: false
    };
  }

  _handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      const value = this.state.value
      const items = this.state.items
      items.push({ name: value, id: items.length })
      this.setState({ items, value: '' })
    }
  }
   

  render() {
    return (
      <div className={`result ${this.state.checkbox ? 'now' : ''}`} >
        <Checkbox id="box" type="checkbox" onClick={() => this.setState({ checkbox: !this.state.checkbox })} value={this.state.checkbox} />
        <div className="text">{this.props.name}</div>
        <button className="close" onClick={() => (this.props.removeItem(this.props.id), console.log('cild',this.state))}>X</button>
      </div>


    );
  }
}