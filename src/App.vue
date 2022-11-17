<template>
  <div class="workflow" @contextmenu="hiddenRightMenu">

    <!-- Parameter configuration -->
    <el-card>
      <div class="text-align-right" slot="header">
      </div>
      <div class="drag-box border" id="drag">

        <!-- The nodes that are about to be dragged -->
        <ul class="sidebar drag-ul text-align-center font-12">
          <li class="drag-item" title="1">1</li>
          <li class="drag-item" title="2">2</li>
          <li class="drag-item" title="3">3</li>
          <li class="drag-item" title="4">4</li>
        </ul>

        <!-- Main canvas -->
        <section class="drop" @contextmenu="canvasRightClick">
          <div id="canvas" class="canvas">
            <div v-for="node in nodes" :key="node.nodeId" :id="node.nodeId" class="node text-align-center"
              :style="{ left: `${node.position.x}px`, top: `${node.position.y}px` }" v-clickoutside="hiddenRightMenu"
              @contextmenu.prevent.stop="rightClick(node, $event)">
              <div class="padding-5" style="border-radius:5px;">
                <i class="iconfont inline-block vertical-align-middle color-primary margin-right-5"></i>
                <span class="node-name font-12 inline-block not-wrap vertical-align-middle"
                  :title="node.nodeName">{{ node.nodeName }}</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </el-card>

    <!-- Node menu -->
    <ul class="right-menu bg-white border font-12"
      :style="{ left: `${contextMenuPosition[0]}px`, top: `${contextMenuPosition[1]}px` }">
      <template v-if="deleteTarget.type === 'node'">
        <li @click="copyNode">
          <i class="el-icon-document-copy margin-right-5 color-warning"></i>
          copy
        </li>
      </template>
      <li @click="delElement">
        <i class="el-icon-delete margin-right-5 color-warning"></i>
        delete
      </li>
    </ul>

    <!-- footer -->
    <div class="btns">
      <el-button type="primary" @click="handleSaveWorkFlow">
        <i class="iconfont icon-cunchu margin-right-5" style="font-size:14px;"></i>Cохранить
      </el-button>
      <el-button type="primary" @click="handleClean">
        <i class="el-icon-delete" style="font-size:14px;"></i>Очистить
      </el-button>
    </div>
  </div>
</template>

<script>
import clickoutside from '@/utils/clickoutside.js';
import { jsPlumb, jsPlumbUtil } from 'jsplumb';
import jspConfig from '@/utils/jsplumbConfig.js';

export default {
  name: 'workflow',
  directives: { clickoutside },
  computed: {},
  data() {
    return {
      nodeForm: {
        nodeId: '',
        nodeName: '',
        desc: ''
      },

      dragInstance: null,
      dropInstance: null,
      nodes: [],
      currentNode: {},
      deleteTarget: {
        type: '',
        nodeId: '', 
        connection: null 
      },
      isShowDrawer: false, 
      contextMenuPosition: [-100, -100],
      mainContainerWrap: null,
      pan: null,
      flowInfo: {}
    };
  },
  mounted() {
    this.init();
  },
  methods: {
    init() {
      this.jsplumbInit();
    },

    jsplumbInit() {
      jsPlumb.ready(() => {
        let dragInstance = jsPlumb.getInstance();
        let dropInstance = jsPlumb.getInstance(jspConfig);
        this.dragInstance = dragInstance;
        this.dropInstance = dropInstance;

        let dragItem = document.querySelectorAll('.drag-item');
        let dropArea = document.getElementById('canvas');

        this.dragAndDrop(dragInstance, dropInstance, dragItem, dropArea);
        this.fireEvents(dropInstance);
      });
    },

    dragAndDrop(dragInstance, dropInstance, dragItem, dropArea) {
      let self = this;
      let drag = document.getElementById('drag');

      dragInstance.draggable(dragItem, {
        clone: true,
        parent: drag,
        containment: false,
      });

      dragInstance.droppable(dropArea, {
        drop: function (p) {
          let dragEl = p.drag.el;
          let nodeName = dragEl.title;
          let nodeId = jsPlumbUtil.uuid();

          const left = 100
          const top = 100

          let node = {
            nodeId,
            nodeName,
            position: { x: left - 60, y: top + 10 },
            properties: {}
          };

          self.nodes.push(node);
          self.$nextTick(() => {
            self.initNode(dropInstance, nodeId);
          });
        }
      });
    },

    getScale() {
      let scale1;
      let { pan, dropInstance } = this;
      if (pan) {
        const { scale } = pan.getTransform();
        scale1 = scale;
      } else {
        const matrix = window.getComputedStyle(dropInstance.getContainer())
          .transform;
        scale1 = matrix.split(', ')[3] * 1;
      }
      return scale1;
    },

    initNode(dropInstance, nodeId, initType) {
      let dragEl = document.getElementById(nodeId);
      dropInstance.draggable(dragEl, {parent: 'canvas'});

      let sourceAnchor = {
        allowLoopback: false,
        anchor: ['Bottom'],
        anchors: ['Bottom'],
        isSource: true,
        endpoint: [
          'Dot',
          {
            cssClass: 'source-endpoint',
            radius: 5,
            hoverClass: 'cursor-crosshair'
          }
        ],
        paintStyle: {
          stroke: '#7AB02C',
          strokeWidth: 1,
          outlineStroke: '#7AB02C',
          outlineWidth: 1
        }
      };
      
      let targetAnchor = {
        allowLoopback: false,
        anchor: ['Top'],
        anchors: ['Top'],
        isTarget: true,
        endpoint: [
          'Dot',
          {
            cssClass: 'target-endpoint',
            radius: 5
          }
        ],
        paintStyle: {
          stroke: '#409EFF',
          strokeWidth: 1,
          outlineStroke: '#409EFF',
          outlineWidth: 1
        }
      };

      if (initType === 'source') {
        dropInstance.addEndpoint(nodeId, sourceAnchor, {
          uuid: `${nodeId}-source`
        });
        dropInstance.addEndpoint(nodeId, sourceAnchor, {
          uuid: `${nodeId}-source`
        });
      } else if (initType === 'target') {
        dropInstance.addEndpoint(nodeId, targetAnchor, {
          uuid: `${nodeId}-target`
        });
      } else {
        dropInstance.addEndpoint(nodeId, sourceAnchor, {
          uuid: `${nodeId}-source`
        });
        dropInstance.addEndpoint(nodeId, targetAnchor, {
          uuid: `${nodeId}-target`
        });
      }
    },

    fireEvents(instance) {
      let self = this;
      instance.bind('beforeDrop', function ({
        sourceId,
        targetId,
      }) {
        let allConn = instance.getAllConnections();
        let isNoConnect = allConn.length === 0;

        if (isNoConnect) {return true}

        let isSourceIsConnected = allConn.some(item => {return item.sourceId === sourceId});
        let isTargetIsConnected = allConn.some(item => {return item.targetId === targetId});

        if (isSourceIsConnected) {return false}
        if (isTargetIsConnected) {return false}
        return true;
      });

      instance.bind('contextmenu', function (component, event) {
        let { pageX, pageY } = event;
        //The component obtained is Endpoint, but the menu does not display the menu
        if (component.type === 'Dot') {return}

        const left = pageX;
        const top = pageY;

        let position = [left, top];

        self.contextMenuPosition = position;

        // Store deleted objects
        self.deleteTarget = {
          ...{ type: 'connection', connection: component }
        };
        event.preventDefault();
        event.stopPropagation();
      });
    },

    //сообщение сохранения
    saveFlow() {
      this.$message({
        showClose: true,
        message: 'Сохранено',
        type: 'success'
      });
    },

    //Правый клик
    rightClick(node, $event) {
      let { pageX, pageY } = $event;
      const left = pageX;
      const top = pageY;

      this.contextMenuPosition = [left, top];
      this.currentNode = JSON.parse(JSON.stringify(node));
      this.deleteTarget = { ...{ type: 'node', nodeId: node.nodeId } };
    },

    //Копия элемента
    copyNode() {
      let { nodes } = this;
      let { nodeId } = this.currentNode;
      let node = nodes.find(item => {return item.nodeId === nodeId});
      let ele = document.getElementById(nodeId);
      let { offsetLeft, offsetTop } = ele;

      let cloneNodeId = jsPlumbUtil.uuid();
      let cloneNode = {
        ...node,
        ...{
          nodeId: cloneNodeId,
          position: { x: offsetLeft + 20, y: offsetTop + 20 }
        }
      };
      this.nodes.push(cloneNode);
      let { dropInstance } = this;
      this.$nextTick(() => {
        this.initNode(dropInstance, cloneNodeId);
      });
    },

    //Удаление
    delElement() {
      let { deleteTarget, dropInstance } = this;
      let { type, nodeId, connection } = deleteTarget;
      let tip = type === 'node' ? 'Удалить узел' : 'Удалить соединение';
      this.$confirm(tip, 'Предупреждение', {
        confirmButtonText: 'Да',
        cancelButtonText: 'Отмена',
        type: 'warning'
      })
        .then(() => {
          if (type === 'node') {
            this.delNode(dropInstance, nodeId);
          } else if (type === 'connection') {
            this.delConnection(dropInstance, connection);
          }
        })
        .catch(err => {
          console.error({ err });
        });
    },

    //Удаление узла
    delNode(instance, nodeId) {
      instance.remove(nodeId);
      //this.Nodes removed nodes that have been deleted
      let index = this.nodes.findIndex(item => {
        return item.nodeId === nodeId;
      });
      this.nodes.splice(index, 1);
    },

    //Удаление соединения
    delConnection(instance, connection) {
      instance.deleteConnection(connection);
    },

    hiddenRightMenu() {
      this.contextMenuPosition = [-100, -100];
    },

    canvasRightClick(event) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    },

    handleSaveWorkFlow() {
      return this.saveFlow();
    },

    handleClean() {
      this.nodes = [];
      this.dropInstance.empty('canvas');
    },

    redrawOverflow(dropInstance, relation, nodes) {
      dropInstance.batch(() => {
        nodes.forEach(item => {
          this.initNode(dropInstance, item.nodeId);
        });
        relation.forEach(item => {
          dropInstance.connect({
            uuids: [`${item.sourceId}-source`, `${item.targetId}-target`]
          });
        });
      });
    },

  },

  filters: {}
};
</script>

<style >
*:focus {
  outline: none;
}

.workflow {
  width: 800px;
  height: 600px;
  margin: 50px auto;
}

.drag-box {
  position: relative;
  display: flex;
}

.drag-ul {
  margin: 0;
  padding: 0;
  width: 100px;
  background: #f7f9fb;
}

.drop {
  position: relative;
  width: calc(100% - 100px);
  overflow: hidden;
  border: 1px solid #eee;
  outline: none !important;
}

.drop .canvas {
  position: relative;
  height: 100%;
  width: 100%;
  outline: none !important;
}

.node {
  position: absolute;
  text-align: center;
  width: 50px;
  padding: 0 5px;
  border-width: 2px;
  border: 1px solid #409eff;
  border-radius: 5px;
}

.right-menu {
  position: absolute;
  left: 9999px;
  top: 9999px;
  z-index: 100;
  padding: 0;
  margin: 0;
  box-shadow: 1px 1px 3px #eee;
  background: #fff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.right-menu li {
  list-style: none;
  padding: 0 10px;
  height: 30px;
  line-height: 30px;
  font-size: 12px;
  cursor: pointer;
}

.node-name {
  max-width: 75px;
}

.select-node {
  background: #00c88d;
  color: #fff;
}

.connectorHoverClass path {
  stroke: #00c88d;
}

.node-log {
  height: 100%;
  width: 100%;
}

.side-content {
  height: 100%;
  width: 100%;
}

.toolbar {
  border-bottom: none;
  height: 50px;
  line-height: 50px;
}

.drag-item {
  margin-bottom: 10px;
  cursor: move;
  color: rgb(27, 28, 35);
  border: 1px solid #409eff;
  border-radius: 5px;
  text-align: center;
  list-style: none;
}

.drag-box {
  height: 400px;
}

.text-align-right {
  text-align: right;
}

.cursor-crosshair {
  cursor: crosshair;
}

.btns {
  margin-top: 20px;
  text-align: center;
}

.btn-box {
  padding: 10px;
}
</style>