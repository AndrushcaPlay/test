import React from 'react';
import './App.css';
import Item from './item'
import TextField from '@material-ui/core/TextField';

export default class ToDoList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      items: [],
      value: '',
    };
  }


  _handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      const value = this.state.value
      const items = this.state.items
      items.push({ name: value, id: Math.floor(Math.random() * Math.floor(1000000000000000000000000000)) })
      this.setState({ items, value: '' })
    }
  }

  removeItem = (id) => {
    this.setState({
      items: this.state.items.filter((el) => el.id !== id )
    });
  }

  render() {
    console.log('this.state', this.state)
    return (
      <div className="App">
        <div className="name-App">todos</div>
        <div className="input-App">
        <TextField
        type="text"
        placeholder="What needs to be done?"
        id="outlined-name get_num"
        label="Note"
        margin="normal"
        variant="outlined"
        value={this.state.value}
        onKeyDown={el => this._handleKeyDown(el)}
        onChange={el => this.setState({ value: el.target.value })}
      />
        </div>
        {
          this.state.items.map(el => {
            return < Item name={el.name} id={el.id} removeItem={this.removeItem}/>
          })
        }
      </div>
    );
  }
}