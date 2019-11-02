import React from 'react';
import './App.css';

class App extends React.Component {

    state = {
        isToastShow: false, // 是否展示 Toast
        toastText: '', // Toast 文字内容
    }

    // 设置 Toast 属性
    handleToastShow = (toastText, showTime) => {
        this.setState({
            isToastShow: true,
            toastText
        });
        // 定时销毁 Toast Dom
        setTimeout(() => {
            this.setState({
                isToastShow: false
            })
        }, showTime)
    }

    // 显示 Toast
    handleShowToast = () => {
        this.handleToastShow('this is a toast', 3000)
    }

    render() {
        const { isToastShow, toastText } = this.state;
        return (
            <div>
                <button onClick={this.handleShowToast}>show toast</button>
                {isToastShow && <div className="toast-wrap">
                    <div className="toast-mask" />
                    <div className="toast-text">{toastText}</div>
                </div>}
            </div>
        )
    }
}

export default App;
