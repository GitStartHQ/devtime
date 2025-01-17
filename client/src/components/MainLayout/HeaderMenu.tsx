import { Menu } from 'antd';
import {
    BarsOutlined,
    AreaChartOutlined,
    SearchOutlined,
    SettingOutlined,
    QuestionCircleOutlined,
} from '@ant-design/icons';
import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import tocklerIcon from '../../assets/icons/GitStart-DevTime-Icon_medium.svg';
import { Brand, Img } from './HeaderMenu.styles';

const GrayMenu = styled(Menu)``;

export const HeaderMenu = ({ location }: any) => (
    <GrayMenu selectedKeys={[location.pathname]} mode="horizontal">
        <Menu.Item key="/app/timeline2">
            <Link to="/app/timeline">
                <Brand>
                    <Img src={tocklerIcon} width="28" height="28" />
                    <span>GitStart DevTime</span>
                </Brand>
            </Link>
        </Menu.Item>
        <Menu.Item key="/app/timeline">
            <Link to="/app/timeline">
                <BarsOutlined />
                Timeline
            </Link>
        </Menu.Item>
        <Menu.Item key="/app/summary">
            <Link to="/app/summary">
                <AreaChartOutlined />
                Summary
            </Link>
        </Menu.Item>
        <Menu.Item key="/app/search">
            <Link to="/app/search">
                <SearchOutlined />
                Search
            </Link>
        </Menu.Item>
        <Menu.Item key="/app/settings">
            <Link to="/app/settings">
                <SettingOutlined />
                Settings
            </Link>
        </Menu.Item>

        <Menu.Item key="/app/support">
            <Link to="/app/support">
                <QuestionCircleOutlined />
                Support
            </Link>
        </Menu.Item>
    </GrayMenu>
);
