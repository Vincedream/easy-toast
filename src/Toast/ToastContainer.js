import React, { Component } from 'react';

import ToastItem from './ToastItem';
import "./ToastContainer.css";

class ToastContainer extends Component {
    state = {
        isShowMask: false, // 当前 mask 是否显示
        toastList: [] // 当前 Toast item 列表
    }
    
    // 将新的 toast push 到 toastContainer 中
    pushToast = (toastProps) => {
        const { type, text, duration, isShowMask = false } = toastProps;
        const { toastList } = this.state;
        toastList.push({
            id: getUuid(),
            type,
            text,
            duration,
            isShowMask
        });
        this.setState({
            toastList,
            isShowMask
        });
    }

    // 将被销毁的 toast 剔除
    popToast = (id, isShowMask) => {
        const { toastList } = this.state;
        const newList = toastList.filter(item => item.id !== id);
        this.setState({
            toastList: newList,
        });
        // 该 toast item 是否为 toastList 中 duration 最长的 item
        let isTheMaxDuration = true;
        // 该 toast item 的 duration
        const targetDuration = toastList.find(item => item.id === id).duration;
        // 遍历 toastList 检查是否为最长 duration
        toastList.forEach(item => {
            if (item.isShowMask && item.duration > targetDuration) {
                isTheMaxDuration = false
            }
            return null;
        });

        // 隐藏 mask
        if (isShowMask && isTheMaxDuration) {
            this.setState({
                isShowMask: false
            })
        }
    }

    render() {
        const { toastList, isShowMask } = this.state;
        return (
            <div className="toast-container">
                {isShowMask && <div className="mask"/>}
                <div className="toast-wrap">
                    {toastList.reverse().map((item) => (
                        <ToastItem onClose={this.popToast} {...item} key={item.id} />
                    ))}
                </div>
            </div>
        );
    }
}

let toastCount = 0;

// 生成唯一的id
const getUuid = () => {
    return 'toast-container' + new Date().getTime() + '-' + toastCount++;
};

export default ToastContainer;