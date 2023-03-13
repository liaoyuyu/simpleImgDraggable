// 简单拖拽 插件
(function (win) {
    "use strict";

    // 简单图片拖拽方法  elesOrName: 元素对象列表  或者  元素类名或id
    function simpleImgDraggable(elesOrName, options = {}) {
        this.eles = elesOrName;//html对象，默认 elesOrName 是 对象列表

        // 判断是否不是 元素对象列表
        if (!(elesOrName instanceof NodeList)) {
            // 获取 对象列表
            this.eles = document.querySelectorAll(elesOrName);// 对象列表
        }
        if (!this.eles.length) throw "获取 elesOrName 对象失败"

        // 参数
        this.options = {
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
            ondragstart: (i, e) => { },//开始拖动事件，对应触摸拖拽中的 touchstart
            ondrag: (i, e) => { },//拖拽中，对应触摸拖拽中的 touchmove
            ondragend: (i, e, conI, con) => { },//拖动结束事件，对应触摸拖拽中的 touchend
            ondragenter: (i, e) => { },//拖入容器触发一次事件
            ondragleave: (conI, con) => { },//拖离容器触发一次事件
            ondragover: (conI, con) => { },//在容器中拖动触发事件
            success: (index, e, conI, con) => { },//成功返回事件，ele:拖入容器元素对象
        };

        // 整理 option
        if (typeof options.copyOverhead == 'boolean') {
            let s = options.copyOverhead;
            options.copyOverhead = this.options.copyOverhead;
            options.copyOverhead.isCopy = s;
        }
        for (const key in options) {
            if (typeof options[key] == 'object') {
                this.options[key] = Object.assign(this.options[key], options[key])
            } else {
                this.options[key] = options[key];
            }
        }

        this.isInConDrop = null;//在哪个容器中释放的
        this.copyEle = null;//复制的对象
        this.index = -1;//拖动对象索引
        // 可拖入容器，html对象
        this.canDragInCon = this.getCanDragInCons();

        // 浏览器css前缀
        this.vandor = this.vandorPrefix();
        this.transform = this.cssPrefixfunc("transform");
        // 事件集合
        this.Event = {
            x: 0,
            y: 0,
            // 拖拽开始事件
            dragstart: (e) => {
                this.isInConDrop = null;
                this.copyEle = null;
                this.index = -1;
                // 保存拖动索引
                this.index = e.target.index;
                // 执行，我想要的程序
                this.options.ondragstart && this.options.ondragstart(this.index, e.target);
            },
            // 拖拽中
            drag: (e) => {
                // 执行，我想要的程序
                this.options.ondrag && this.options.ondrag(this.index, e.target);
            },
            // 拖动结束事件
            dragend: (e) => {
                // 执行，我想要的程序
                this.options.ondragend && this.options.ondragend(this.index, e.target, this.isInConDrop?.index, this.isInConDrop || undefined);
                // 清楚拖动索引
                this.index = -1;
                this.isInConDrop = null;
                this.copyEle = null;
            },
            // 触摸端没有拖拽事件
            touchstart: (e) => {
                // 保存拖动索引
                this.index = e.target.index;

                // 触摸点
                this.Event.x = e.targetTouches[0].clientX;
                this.Event.y = e.targetTouches[0].clientY;
                // 判断是否需要复制一份，顶置
                if (this.options.copyOverhead.isCopy) {
                    this.copyOverheadFunc(e.target);
                }

                // 执行，我想要的程序
                this.options.ondragstart && this.options.ondragstart(this.index, e.target);
            },
            touchmove: (e) => {
                let x = e.targetTouches[0].clientX - this.Event.x;
                let y = e.targetTouches[0].clientY - this.Event.y;
                // 判断是否有 复制
                if (this.copyEle) {
                    this.copyEle.style[this.transform] = `translate3d(${x}px,${y}px,1px)`;
                } else {
                    e.target.style[this.transform] = `translate3d(${x}px,${y}px,1px)`;
                }

                // 判断 是否 进入容器、离开容器、在容器中拖拽
                this.isConDragType(this.copyEle ? this.copyEle : e.target);

                // 执行，我想要的程序
                this.options.ondrag && this.options.ondrag(this.index, e.target);
            },
            touchend: (e) => {
                // 判断是否在容器中释放的
                if (this.isInConDrop) {
                    this.Event.drop(e);
                }
                // 执行，我想要的程序
                this.options.ondragend && this.options.ondragend(this.index, e.target, this.isInConDrop?.index, this.isInConDrop || undefined);

                // 清楚拖动索引
                this.index = -1;

                this.Event.x = 0;
                this.Event.y = 0;
                if (this.copyEle) {
                    // 删除
                    this.copyEle.remove();
                    this.copyEle = null;
                } else {
                    e.target.style[this.transform] = `translate3d(0,0,0)`;
                }
            },
            // 容器事件 ***************
            // 拖入容器事件
            dragenter: (e) => {
                this.isInConDrop = e.target ? e.target : e;
                // 执行，我想要的程序
                this.options.ondragenter && this.options.ondragenter(this.isInConDrop.index, this.isInConDrop);
            },
            // 拖离容器事件
            dragleave: () => {
                // 执行，我想要的程序
                this.options.ondragleave && this.options.ondragleave(this.isInConDrop.index, this.isInConDrop);
            },
            // 在容器中拖动事件
            dragover: () => {
                // 执行，我想要的程序
                this.options.ondragover && this.options.ondragover(this.isInConDrop.index, this.isInConDrop);
                event.preventDefault();
            },
            // 释放事件
            drop: (e) => {
                // 只要释放，就说明拖动成功
                this.options.success && this.options.success(this.index, this.eles[this.index], this.isInConDrop.index, this.isInConDrop);
            },
        }


        // 循环 元素对象列表，添加事件
        this.loopListAddEvent();
        // 可拖入容器，添加事件
        this.dragInConAddEvent();
    }

    // 添加事件
    simpleImgDraggable.prototype.addEvent = function (ele, eventName, callback) {
        ele && eventName && callback && ele.addEventListener(eventName, callback);
    }
    // 移除事件
    simpleImgDraggable.prototype.removeEvent = function (ele, eventName, callback) {
        ele && eventName && callback && ele.removeEventListener(eventName, callback);
    }


    // 拖动元素**************************
    // 循环元素列表，添加事件
    simpleImgDraggable.prototype.loopListAddEvent = function () {
        // 循环
        this.eles.forEach((v, i) => {
            try {
                v.index = i;//添加索引
                // 鼠标事件
                this.addEvent(v, 'dragstart', this.Event.dragstart);//开始拖拽
                this.addEvent(v, 'drag', this.Event.drag);//拖动中
                this.addEvent(v, 'dragend', this.Event.dragend);//拖拽结束
                // 触摸事件
                this.addEvent(v, 'touchstart', this.Event.touchstart);//触摸开始
                this.addEvent(v, 'touchmove', this.Event.touchmove);//触摸移动
                this.addEvent(v, 'touchend', this.Event.touchend);//触摸结束
            } catch (error) {
                throw error;
            }
        })
    }
    // 循环元素列表，添加事件
    simpleImgDraggable.prototype.loopListRemoveEvent = function () {
        // 循环
        this.eles.forEach((v, i) => {
            try {
                // 鼠标事件
                this.removeEvent(v, 'dragstart', this.Event.dragstart);//开始拖拽
                this.removeEvent(v, 'dragend', this.Event.dragend);//拖拽结束
                // 触摸事件
                this.removeEvent(v, 'touchstart', this.Event.touchstart);//触摸开始
                this.removeEvent(v, 'touchmove', this.Event.touchmove);//触摸移动
                this.removeEvent(v, 'touchend', this.Event.touchend);//触摸结束
            } catch (error) {
                throw error;
            }
        })
    }
    // 容器****************************
    // 获取 可拖入容器 的 html对象 合集
    simpleImgDraggable.prototype.getCanDragInCons = function () {
        let canDragInCon = [];
        if (this.options.canDragInCon instanceof Array) {
            // 循环 名称，获取html元素对象
            this.options.canDragInCon.forEach((name, i) => {
                try {
                    let doc = document.querySelector(name);
                    // 获取定位，后面不不需要重复获取了
                    let post = doc.getBoundingClientRect();
                    doc.postInfo = post;
                    doc.index = i;
                    canDragInCon.push(doc);
                } catch (error) { }
            });
        }
        return canDragInCon;
    }
    // 拖入容器，添加拖入拖出事件
    simpleImgDraggable.prototype.dragInConAddEvent = function () {
        // 循环添加 容器 事件
        this.canDragInCon.forEach(dragInEle => {
            try {
                this.addEvent(dragInEle, 'dragenter', this.Event.dragenter);// 拖入容器事件
                this.addEvent(dragInEle, 'dragleave', this.Event.dragleave);// 拖离容器事件
                this.addEvent(dragInEle, 'dragover', this.Event.dragover);// 在容器中拖动事件
                this.addEvent(dragInEle, 'drop', this.Event.drop);// 释放事件
            } catch (error) {
                throw error;
            }
        });
    }
    // 拖入容器，移除拖入拖出事件
    simpleImgDraggable.prototype.dragInConRemoveEvent = function () {
        // 循环移除 容器 事件
        this.canDragInCon.forEach(dragInEle => {
            try {
                this.removeEvent(dragInEle, 'dragenter', this.Event.dragenter);// 拖入容器事件
                this.removeEvent(dragInEle, 'dragleave', this.Event.dragleave);// 拖离容器事件
                this.removeEvent(dragInEle, 'dragover', this.Event.dragover);// 在容器中拖动事件
                this.removeEvent(dragInEle, 'drop', this.Event.drop);// 释放事件
            } catch (error) {
                throw error;
            }
        });
    }
    // 触摸，判断 是否 进入容器，离开容器，在容器中拖拽
    simpleImgDraggable.prototype.isConDragType = function (e) {
        let epost = e.getBoundingClientRect();
        let cons = this.canDragInCon;
        cons.forEach(v => {
            // 循环判断 e 拖拽对象，是否在 容器中
            let postInfo = v.postInfo;
            // 判断是否进入
            if ((epost.left >= postInfo.left && epost.right <= postInfo.right) && (epost.top >= postInfo.top && epost.bottom <= postInfo.bottom)) {
                // 返回方法
                if (!this.isInConDrop) {
                    // 执行一次，进入容器方法
                    this.Event.dragenter(v);
                }

                // 在容器中拖拽方法
                this.Event.dragover(v);
                // 保存 判断类型
                this.isInConDrop = v;
            } else {
                // 返回方法
                if (this.isInConDrop) {
                    // 执行一次，离开容器方法
                    this.Event.dragleave();
                }
                this.isInConDrop = null;
            }
        });
    }
    // 其他事件***********************
    // 获取 浏览器css 前缀
    simpleImgDraggable.prototype.vandorPrefix = function () {
        let css_prefix = document.querySelector('body').style;
        let transformPrefix = {//浏览器内核
            webkit: "webkitTransform",
            Mos: "MosTransform",
            O: "OTransform",
            ms: "msTransform",
            original: "transform"
        }

        // 循环判断当前浏览器是那个内核
        // key 就是内核前缀
        for (let key in transformPrefix) {
            if (css_prefix[transformPrefix[key]] != undefined) {
                return key;
            }
        }

        return false;
    }
    // 拼接 css，获取完整浏览器
    simpleImgDraggable.prototype.cssPrefixfunc = function (cssStyle) {
        if (cssStyle == undefined || this.vandor == false) return false;

        // original，不需要添加内核
        if (this.vandor == "original") return cssStyle;

        // 有内核的//首字母大写,js添加css，除内核前缀的首字母大写
        return this.vandor + cssStyle.charAt(0).toUpperCase() + cssStyle.substr(1);
    }
    // 复制html，并顶置，定位
    simpleImgDraggable.prototype.copyOverheadFunc = function (e) {
        // 判断是否有塞入位置
        if (this.options.copyOverhead.overheadPost) {
            // 复制，并且复制子节点
            let a = e.cloneNode(true);
            // 设置 大小，默认一样大
            a.style.width = e.clientWidth + 'px';
            a.style.height = e.clientHeight + 'px';
            // 添加 类名
            if (this.options.copyOverhead.copyCalss) a.classList.add(this.options.copyOverhead.copyCalss);
            // 定位
            let post = e.getBoundingClientRect();
            a.style.position = 'fixed';
            a.style.top = post.top + 'px';
            a.style.left = post.left + 'px';
            // 塞入位置
            document.querySelector(this.options.copyOverhead.overheadPost).appendChild(a);
            this.copyEle = a;
        }
    }
    // 销毁
    simpleImgDraggable.prototype.destroy = function () {
        // 移除所有事件
        this.loopListRemoveEvent();
        this.dragInConRemoveEvent();
        // 清空
        this.eles = null;
        this.options = null;
        this.isInConDrop = null;
        this.copyEle = null;//复制的对象
        this.index = null;
        this.vandor = null;
        this.canDragInCon = null;
        this.Event = null;
        this.transform = null;
    }

    // 抛出
    if (typeof module !== 'undefined' && module.exports) module.exports = simpleImgDraggable;
    win.simpleImgDraggable = simpleImgDraggable;
})(window)