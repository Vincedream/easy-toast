import React, { Component } from 'react';
import "./ToastItem.css";

class ToastItem extends Component {
    componentDidMount() {
        const { id, duration, onClose, isShowMask } = this.props;
        this.timer = setTimeout(() => {
            if (onClose) {
                onClose(id, isShowMask);
            }
        }, duration)
    }
    // 卸载组件后，清除定时器
    componentWillUnmount() {
        clearTimeout(this.timer)
    }
    render() {
        const { text } = this.props;
        return (
            <div className="toast-item">
                {text}
            </div>
        );
    }
}

export default ToastItem;