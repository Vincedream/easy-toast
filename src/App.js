import React from 'react';
import Toast from './Toast';

function App () {
  const handleClick1 = () => {
    Toast.info('test111', 2000);
  }

  const handleClick2 = () => {
    Toast.info('test222', 1000, true);
  }

  const handleClick3 = () => {
    Toast.info('test333', 1000, true);
    Toast.info('test long duration', 4000, true);
  }

  const handleHideAllToast = () => {
    Toast.hide();
  }

  return(
    <div>
      <button onClick={handleClick1}>no mask Toast</button><br/>
      <button onClick={handleClick2}>with mask Toast</button><br/>
      <button onClick={handleClick3}>long duration</button><br/>
      <button onClick={handleHideAllToast}>hideAllToast</button>
    </div>
  )
}

export default App;
