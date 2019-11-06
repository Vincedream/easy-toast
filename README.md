## 前言

在业务开发中，特别是移动端的业务，Toast 使用非常频繁，几乎涵盖所有操作结果反馈的交互：如提交表单成功、验证表单失败提示、loading 态提醒...，这种轻量且使用较为频繁的组件，我们要求它使用足够简单，不侵入业务代码，即用即丢，基于这些要求，Toast 组件的实现方式也与其他组件有着不一样的关键点，这也是本篇博客的存在意义。

## 关键点

### 使用足够简单

因为使用非常频繁，且要求其随地可用，因此，我们希望只用一行代码：

```
Toast.info('this is a toast', 1000);
```

### 无需手动插入组件容器

我们使用其他诸如 antd 组件时，大部分的组件需要注入到业务 Dom 中，例如：

```
render() {
    return (
        <div>other components...</div>
        <Dropdown overlay={menu}>
            <a className="ant-dropdown-link" href="#">
              Hover me <Icon type="down" />
            </a>
        </Dropdown>,
    )
}
```

然而因为 Toast 组件无需常驻页面当中，即用即丢，且使用的位置千变万化，假如需要每次都在需要 Toast 的页面当中手动注入组件的话，会非常影响效率和业务代码的可维护性。

### 多个 Toast 互不影响

业务中往往会存在多个提示同时发出的场景，比如两个接口同时请求失败需要同事提示错误原因，那么 Toast 就要求不能产生冲突。

## mini 版 toast

按照我们书写组件的惯性思维，我们实现一版最简单的 toast，只需要满足其基本使用，实现后，我们再分析其存在的问题。

### 实现

再不考虑上述关键点的情况下，我们书写如下代码来实现最简单粗暴的 Toast：

```
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
```

### 问题

这里我们发现了几个问题：

1. 一个简单的 Toast 竟然需要定义两个 state，增大了维护业务逻辑的心智，可维护性降低。
2. 需要将 Toast 逻辑和 Dom，甚至是样式，注入到业务代码中，降低业务代码的可读性。
3. 不能同时显示多个 Toast

针对这些问题，接下来我们逐步实现一个使用简单方便的 Toast。

## 完整版实现

项目源码地址： [Vincedream/easy-toast](https://github.com/Vincedream/easy-toast)


### 调用方法

在讲解组件实现前，我们简单地阅览实现后的调用方法：

```
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
```

效果：

![image](http://static4.vince.xin/FTSJFIDJFIOF44534.gif)

这里，我们调用了 `Toast.info()`后，动态地注入组件到 Dom 中，并没有将 Toast 任何逻辑在业务容器中的 Dom 或者 Style 中注入。

### 动态注入 Dom 关键方法

我们如何在不侵入容器的条件下，动态地注入 Dom，难道是像十年前 jQuery 时代去手动操作 Dom 吗？肯定不是的。这里有个关键的方法：`ReactDom.render(<组件/>, 真实 Dom)`，下面我们看一个例子：

```
class App extends React.Component {

    handleAddDom = () => {
        // 在真实 dom 上创建一个真的的 div 宿主节点，并将其加入到页面根节点 body 当中
        const containerDiv = document.createElement('div');
        document.body.appendChild(containerDiv);
        // 这里返回的是对该组件的引用
        const TestCompInstance = ReactDom.render(<TestComp />, containerDiv);
        console.log(TestCompInstance);
        // 这里可以调用任何 TestCompInstance 上的方法，并且能够访问到其 this
        TestCompInstance.sayName();
    }

    render() {
        return (
            <div>
                <button onClick={this.handleAddDom}>add Dom</button>
            </div>
        )
    }
}
```

执行结果：

![image](http://static4.vince.xin/GHJKLTYUIORFVBNM.gif)

从上面的例子我们可以看出，我们可以在 js 逻辑代码中直接创建注入一个 React 组件到真实的  dom 中，并且可以任意操控该组件，理解这点后，我们便得到了编写 Toast 组件最核心的方法。

### 具体实现

首先，我们创建一个 Toast 容器组件：

```
// ToastContainer.js
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


    render() {
        const { toastList, isShowMask } = this.state;
        return (
            <div className="toast-container">
                {isShowMask && <div className="mask"/>}
                <div className="toast-wrap">
                    {toastList.reverse().map((item) => (
                        <Toast {...item} key={item.id} />
                    ))}
                </div>
            </div>
        );
    }
}
```

这个容器用来存放多个 Toast Item，用来控制 Toast 的显示个数和是否展示 mask，并且将其渲染到容器当中，这里面逻辑非常简单。

接着我们创建真正用来展示的 Toast Item 组件：

```
// ToastItem.js
class ToastItem extends Component {
    render() {
        const { text } = this.props;
        return (
            <div className="toast-item">
                {text}
            </div>
        );
    }
}
```

两个关键组件已经创建完成，我们需要“动态注入”将其渲染到 dom 中，使用上面讲解的 `ReactDom.render()` 方法，为此，我们在创建一个 Toast 统一入口文件:


```
// index.js
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


export default {
    info: (text, duration, isShowMask) => (toastContainer.pushToast({type: 'info', text, duration, isShowMask})),
};
```

这里，我们按照上面讲解的 `ReactDom.render()` 方法， 将 `<ToastContainer />` 渲染到 dom 中，并且获得了其引用，我们只需要在这里调用 `<ToastContainer />` 中的 `pushToast` 方法，便能展示出 Toast 提示。

到这里，我们便完成了一个最简化版的 **动态注入版 Toast 组件**，接下来的一节中，我们将为其添加以下两个功能：

1. 定时隐藏 Toast
2. 强制隐藏 Toast

## 完善功能

### 定时隐藏 Toast

首先我们改造 ToastContainer 容器组件，添加一个隐藏 mask 方法，并将其传入到 `<ToastItem />` 中：

```
class ToastContainer extends Component {
    ...

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
        ...
        <ToastItem onClose={this.popToast} {...item} key={item.id} />
        ...     
    }
}
```

接着，我们改造 `<ToastItem />`，在起 `componentDidMount` 中设置一个定时器，根据传入的 duration 参数，设置隐藏 Toast 的定时器，并且在组件销毁前，将定时器清除。

```
// ToastItem.js
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
       ...
    }
}
```

这里我们便完成了隐藏 Toast 的功能，其细节在代码中有详细的解释，这里不再做赘述。

### 强制隐藏 Toast

如何强制的隐藏已经出现的 Toast 呢？这里我们依旧使用到 `ReactDom` 的 api：`ReactDom.unmountComponentAtNode(container)`，这个方法的作用是从 Dom 中卸载组件，会将其事件处理器（event handlers）和 state 一并清除：

```
// index.js
...
// 这里返回的是 ToastContainer 组件引用
const getToastContainerRef = () => {
    // 将 <ToastContainer /> React 组件，渲染到 toastContainerDiv 中，并且返回了 <ToastContainer /> 的引用
    return ReactDom.render(<ToastContainer />, toastContainerDiv);
}
// 这里是 <ToastContainer /> 的引用
let toastContainer = getToastContainerRef();
const destroy = () => {
    // 将 <ToastContainer /> 组件 unMount，卸载组件
    ReactDom.unmountComponentAtNode(toastContainerDiv);
    // 再次创建新的 <ToastContainer /> 引用，以便再次触发 Toast
    toastContainer = getToastContainerRef();
}


export default {
    ...
    hide: destroy
};
```

需要注意的是，卸载 `<ToastContainer />` 后，需要再次创建一个新的、空的 `<ToastContainer />` 组件，以便后续再次调用 Toast。

## 总结

本篇文章我们用了新的一种方法来创建一个特殊的 React 组件，实践了一些你或许没有使用过的 ReactDom 方法，除了 Toast 组件，我们还能用同样的思路编写其他的组件，如 Modal、Notification 等组件。

参考：

[ReactDOM](https://zh-hans.reactjs.org/docs/react-dom.html)

项目源码地址： [Vincedream/easy-toast](https://github.com/Vincedream/easy-toast)

