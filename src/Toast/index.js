import React from 'react';
import ReactDom from 'react-dom';

import ToastContainer from './ToastContainer';

// 在真实 dom 中创建一个 div 节点，并且注入到 body 根结点中，该节点用来存放下面的 React 组件
const toastContainerDiv = document.createElement('div');
document.body.appendChild(toastContainerDiv);

// 这里返回的是 ToastContainer 组件引用
const getToastContainerRef = () => {
    // 将 <ToastContainer /> React 组件，渲染到 toastContainerDiv 中，并且返回了 <ToastContainer /> 的引用
    return ReactDom.render(<ToastContainer />, toastContainerDiv);
}

// 这里是 <ToastContainer /> 的引用
let toastContainer = getToastContainerRef();

const destroy = () => {
    // 将 <ToastContainer /> 组件 unMount，销毁组件
    ReactDom.unmountComponentAtNode(toastContainerDiv);
    // 再次创建新的 <ToastContainer /> 引用，以便再次触发 Toast
    toastContainer = getToastContainerRef();
}


export default {
    info: (text, duration, isShowMask) => (toastContainer.pushToast({type: 'info', text, duration, isShowMask})),
    hide: destroy
};