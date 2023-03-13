# 简单图片拖拽-js插件，支持 pc、移动、触摸屏

<br/>

## 1、使用
```html
<!-- 普通引入 -->
<script src="./simpleImgDraggable.js"></script>
```
```js
// vue引入
import simpleImgDraggable from '../assets/js/simpleImgDraggable'
```


<br/>

```js
    // ele 拖拽对象 类名、ID、元素对象（NodeList）
    new simpleImgDraggable(ele, {
         /**
         * 触摸屏有效，是否复制一份拖拽元素，并且拖拽时复制元素
         * 有些布局，有overflow: hidden，需要拖动跟随鼠标，所有需要复制一份并且顶置，不复制的话，拖不出去
         * 简写 copyOverhead:true,
         */
        copyOverhead: {
            isCopy: false,//是否复制
            copyCalss: '',//复制一份的 类名，用于有些需要修改样式
            overheadPost: 'body',//定位在那个位置，类名
        },
        canDragInCon: [],//可拖入容器，类名或者 id，合集
        //开始拖动事件，对应触摸拖拽中的
        ondragstart: (index, e) => {},
        //拖拽中，对应触摸拖拽中的
        ondrag: (index, e) => { },
        //拖动结束事件，对应触摸拖拽中的
        ondragend: (index, e, dargInBoxIndex, dargInBox) => {},
        //拖入容器触发一次事件
        ondragenter: (dargInBoxIndex, dargInBox) => {},
        //拖离容器触发一次事件
        ondragleave: (dargInBoxIndex, dargInBox) => {},
        //在容器中拖动触发事件
        ondragover: (dargInBoxIndex, dargInBox) => { },
        // 拖动进入容器成功返回事件
        success: (index, e, dargInBoxIndex, dargInBox) => {}
    });
```

<br/><br/>

## 3、参数说明

参数名 | 参数描述
:------ | :------
copyOverhead    |   {}
copyOverhead.isCopy | 是否复制一份拖拽元素（触摸端没有鼠标拖拽灵活，需要复制一份，来达到任意拖拽，不然会被很多样式限制）
copyOverhead.copyCalss | 复制的拖拽元素，添加的类名，因为复制后，可能样式不会继承，需要自己添加个类名
copyOverhead.overheadPost | 复制的拖拽元素，插入位置
|
canDragInCon       | [],拖入容器类名、id 数组

<br/><br/>

## 3、事件返回 参数说明

参数名 | 参数描述
:------ | :------
index   |  拖拽元素索引
e       |  拖拽元素
dargInBoxIndex  |   拖入容器索引（拖入的哪个容器的索引）
dargInBox       |    拖入容器元素


<br/><br/>


## 4、销毁，移除绑定事件，清空内部变量

```js
    let a = new simpleImgDraggable(****);
    a.destroy();
```