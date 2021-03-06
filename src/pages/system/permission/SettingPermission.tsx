import { Component } from 'react';
import React from 'react';
import { Modal, Tree, Tabs, Row, Col, Card, Button, message } from 'antd';
import { Dispatch } from 'redux';
import { connect } from 'dva';
import { ConnectState } from '@/models/connect';
import { PermissionModelState } from '@/models/permission';
import { PermissionDetail } from '@/components/SettingAutz/data';
import { AutzSetting, Permission } from '@/components/SettingAutz/AutzSetting';

interface SettingPermissionProps {
  dispatch?: Dispatch<any>;
  settingVisible: () => void;
  loading?: boolean;
  permission?: PermissionModelState;
  settingType: string;
  settingId: string;
}

interface SettingPermissionState {
  expandedKeys: string[];
  autoExpandParent: boolean;
  checkedKeys: string[] | { checked: string[]; halfChecked: string[] };
  selectedKeys: string[];
  flag: boolean;
}
@connect(({ permission, loading }: ConnectState) => ({
  permission,
  loading: loading.models.permission,
}))
class SettingPermission extends Component<SettingPermissionProps, SettingPermissionState> {
  state = {
    expandedKeys: [],
    autoExpandParent: true,
    checkedKeys: [],
    selectedKeys: [],
    flag: false,
  };

  componentDidMount() {
    //获取数据
    const { dispatch, settingId, settingType } = this.props;

    if (!dispatch) return;
    dispatch({
      type: 'permission/fetch',
      payload: {
        paging: 'false',
      },
    });

    //获取已经选择的节点
    if (settingId) {
      dispatch({
        type: 'permission/autzSetting',
        payload: {
          settingType,
          settingId,
        },
        callback: (response: any) => {
          if (response.status === 200) {
            const result = response.result;
            if (result) {
              const permissions = result.details;
              const permissionArray: string[] = [];
              permissions
                .map((item: PermissionDetail) => item.actions.map(action => `${item.permissionId}:${action}`))
                .forEach((element: string[]) => {
                  permissionArray.push(...element);
                });
              this.setState({
                checkedKeys: permissionArray,
              });
            }
          }
        },
      });
    }
  }

  onExpand = (expandedKeys: string[]) => {
    // console.log('onExpand', expandedKeys);
    // if not set autoExpandParent to false, if children expanded, parent can not collapse.
    // or, you can remove all expanded children keys.
    this.setState({
      expandedKeys,
      autoExpandParent: false,
    });
  };

  onCheck = (checkedKeys: string[] | { checked: string[]; halfChecked: string[] }) => {
    // console.log('onCheck', checkedKeys);
    this.setState({ checkedKeys });
  };

  onSelect = (selectedKeys: string[], info: any) => {
    // console.log('onSelect', info);
    this.setState({ selectedKeys });
  };

  renderTreeNodes = (data: any) =>
    data.map((item: any) => {
      if (item.children) {
        return (
          <Tree.TreeNode title={item.title} key={item.key} dataRef={item}>
            {this.renderTreeNodes(item.children)}
          </Tree.TreeNode>
        );
      }
      return <Tree.TreeNode {...item} key={item.key} />;
    });

  formatePermission = () => {
    const { permission } = this.props;
    const data = permission.result.data;
    return data.map(item => {
      const actionList = item.actions.map(action => {
        return {
          title: action.describe,
          key: `${item.id}:${action.action}`,
        };
      });
      return {
        title: item.name,
        key: item.id,
        children: actionList,
      };
    });
  };

  save = () => {
    message.success('保存数据');
    const { settingType, settingId, dispatch } = this.props;
    if (!dispatch) return;
    //将已经选择的权限格式化成后台需要的数据类型
    const details = this.resetCheckedPermission();
    const autzSetData = new AutzSetting({
      type: settingType,
      settingFor: settingId,
      priority: '10',
      menus: [],
      details: details,
      merge: true,
    });
    dispatch({
      type: 'permission/setAutzData',
      payload: autzSetData,
      callback: (response: any) => {
        console.log(response, 'autz');
      },
    });
  };

  resetCheckedPermission = (): Permission[] => {
    const { checkedKeys } = this.state;
    const details: any[] | Permission[] = [];
    const detailMap = new Map();
    checkedKeys.forEach((item: string) => {
      if (item.indexOf(':') < 0) {
        detailMap.set(
          item,
          new Permission({
            permissionId: item,
            priority: '10',
            merge: true,
            dataAccesses: [],
            actions: [],
          }),
        );
      }
    });
    checkedKeys.forEach((item: string) => {
      if (item.indexOf(':') > -1) {
        const action = item.split(':');
        detailMap.get(action[0]).actions.push(action[1]);
      }
    });
    detailMap.forEach(element => {
      details.push(element);
    });
    return details;
  };

  render() {
    const { settingVisible, permission } = this.props;
    const { expandedKeys, autoExpandParent, checkedKeys, selectedKeys, flag } = this.state;
    return (
      <Modal visible title="用户赋权" width={840} onCancel={settingVisible} onOk={this.save}>
        <Tabs defaultActiveKey="permission">
          <Tabs.TabPane tab="权限设置" key="permission">
            <Row gutter={24}>
              <Col span={12}>
                <Card title="权限信息" style={{ height: 400, overflow: 'auto' }}>
                  <Tree
                    checkable
                    onExpand={this.onExpand}
                    expandedKeys={expandedKeys}
                    autoExpandParent={autoExpandParent}
                    onCheck={this.onCheck}
                    checkedKeys={checkedKeys}
                    onSelect={this.onSelect}
                    selectedKeys={selectedKeys}
                  >
                    {this.renderTreeNodes(this.formatePermission())}
                  </Tree>
                </Card>
              </Col>
              <Col span={12}>
                <Card>
                  数据权限设置 <Button>应用到所有操作</Button>
                </Card>
              </Col>
            </Row>
          </Tabs.TabPane>
          <Tabs.TabPane tab="菜单设置" key="menu">
            菜单设置
          </Tabs.TabPane>
        </Tabs>
      </Modal>
    );
  }
}

export default SettingPermission;
