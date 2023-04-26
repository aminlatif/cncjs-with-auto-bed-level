import get from 'lodash/get';
import includes from 'lodash/includes';
import pubsub from 'pubsub-js';
// import map from 'lodash/map';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import Space from 'app/components/Space';
import Widget from 'app/components/Widget';
import store from 'app/store';
import api from 'app/api';
import controller from 'app/lib/controller';
import i18n from 'app/lib/i18n';
import { in2mm, mapValueToUnits } from 'app/lib/units';
import WidgetConfig from '../WidgetConfig';
import BedLevel from './BedLevel';
import RunBedLevel from './RunBedLevel';
import {
  // Units
  IMPERIAL_UNITS,
  METRIC_UNITS,
  // Grbl
  GRBL,
  GRBL_ACTIVE_STATE_IDLE,
  // Marlin
  MARLIN,
  // Smoothie
  SMOOTHIE,
  SMOOTHIE_ACTIVE_STATE_IDLE,
  // TinyG
  TINYG,
  TINYG_MACHINE_STATE_READY,
  TINYG_MACHINE_STATE_STOP,
  TINYG_MACHINE_STATE_END,
  // Workflow
  WORKFLOW_STATE_IDLE
} from '../../constants';
import {
  MODAL_NONE,
  MODAL_PREVIEW
} from './constants';
import styles from './index.styl';

// const gcode = (cmd, params) => {
//   const s = map(params, (value, letter) => String(letter + value)).join(' ');
//   return (s.length > 0) ? (cmd + ' ' + s) : cmd;
// };

class BedLevelWidget extends PureComponent {
    static propTypes = {
      widgetId: PropTypes.string.isRequired,
      onFork: PropTypes.func.isRequired,
      onRemove: PropTypes.func.isRequired,
      sortable: PropTypes.object
    };

    machineProfile = store.get('workspace.machineProfile');


    // Public methods
    collapse = () => {
      this.setState({ minimized: true });
    };

    expand = () => {
      this.setState({ minimized: false });
    };

    config = new WidgetConfig(this.props.widgetId);

    state = this.getInitialState();

    actions = {
      toggleFullscreen: () => {
        const { minimized, isFullscreen } = this.state;
        this.setState({
          minimized: isFullscreen ? minimized : false,
          isFullscreen: !isFullscreen
        });
      },
      toggleMinimized: () => {
        const { minimized } = this.state;
        this.setState({ minimized: !minimized });
      },
      openModal: (name = MODAL_NONE, params = {}) => {
        this.setState({
          modal: {
            name: name,
            params: params
          }
        });
      },
      closeModal: () => {
        this.setState({
          modal: {
            name: MODAL_NONE,
            params: {}
          }
        });
      },
      updateModalParams: (params = {}) => {
        this.setState({
          modal: {
            ...this.state.modal,
            params: {
              ...this.state.modal.params,
              ...params
            }
          }
        });
      },
      handleProbeDepthChange: (event) => {
        const probeDepth = event.target.value;
        this.setState({ probeDepth });
      },
      handleProbeFeedrateChange: (event) => {
        const probeFeedrate = event.target.value;
        this.setState({ probeFeedrate });
      },
      handleTouchPlateHeightChange: (event) => {
        const touchPlateHeight = event.target.value;
        this.setState({ touchPlateHeight });
      },
      handleRetractionDistanceChange: (event) => {
        const retractionDistance = event.target.value;
        this.setState({ retractionDistance });
      },
      handleProbeStartXChange: (event) => {
        const probeStartX = event.target.value;
        this.setState({ probeStartX });
      },
      handleProbeStartYChange: (event) => {
        const probeStartY = event.target.value;
        this.setState({ probeStartY });
      },
      handleProbeDeltaXChange: (event) => {
        const probeDeltaX = event.target.value;
        this.setState({ probeDeltaX });
      },
      handleProbeDeltaYChange: (event) => {
        const probeDeltaY = event.target.value;
        this.setState({ probeDeltaY });
      },
      handleProbeBedXLengthChange: (event) => {
        const probeBedXLength = event.target.value;
        this.setState({ probeBedXLength });
      },
      handleProbeBedYLengthChange: (event) => {
        const probeBedYLength = event.target.value;
        this.setState({ probeBedYLength });
      },
      handleProbeResultChange: (event) => {
        const probeResult = event.target.value;
        this.setState({ probeResult });
      },
      applyBedLeveingToGCode: () => {
        const { port } = this.state;
        const { machineProfile } = this;
        const heightMap = machineProfile.determinedHeightInfo.calculatedHeightInfo.relaitveCoordinates;
        api.bedLevel.apply({ port: port, heightMap: JSON.stringify(heightMap) }).then(
          (res) => {
            const compensatedGCode = res.text;
            console.info('compensated G-Code:', compensatedGCode);
            api.loadGCode({ port, name: 'temp-leveled', gcode: compensatedGCode })
              .then((res) => {
                const { name = '', gcode = '' } = { ...res.body };
                pubsub.publish('gcode:load', { name, gcode });
              })
              .catch((res) => {
                console.error('Failed to upload G-code file');
              })
              .then(() => {
                // stopWaiting();
                // this.setState({ isUploading: false });
              });
          },
          (err) => {
            console.error(err);
          }
        );
      },
      probeForBedLevel: () => {
        const { port, probeDepth, probeFeedrate, touchPlateHeight, retractionDistance } = this.state;
        const { probeStartX, probeStartY, probeDeltaX, probeDeltaY, probeBedXLength, probeBedYLength } = this.state;
        const options = { port, probeDepth, probeFeedrate, touchPlateHeight, retractionDistance, probeStartX, probeStartY, probeDeltaX, probeDeltaY, probeBedXLength, probeBedYLength };
        api.bedLevel.probe(options).then(
          (res) => {
            const probeResult = res.text;
            this.setState({ probeResult: probeResult });
            console.log(probeResult);
          },
          (err) => {
            console.error(err);
          }
        );
      },
      applyProbResult: () => {
        const { probeResult } = this.state;
        const { machineProfile } = this;

        if (probeResult) {
          const heightMap = JSON.parse(probeResult);
          const newHeightMap = JSON.stringify(heightMap);
          console.log(newHeightMap);
          console.log(machineProfile.id);
          api.machines.updateHeightInfo(machineProfile.id, { heightInfo: newHeightMap });
          // this.machineProfile.heightInfo = newHeightMap;
          // store.set('workspace.machineProfile', this.machineProfile);
        } else {
          console.error('No probe result found');
        }
      }
    };

    controllerEvents = {
      'serialport:open': (options) => {
        const { port } = options;
        this.setState({ port: port });
      },
      'serialport:close': (options) => {
        const initialState = this.getInitialState();
        this.setState({ ...initialState });
      },
      'workflow:state': (workflowState) => {
        this.setState(state => ({
          workflow: {
            state: workflowState
          }
        }));
      },
      'controller:state': (type, state) => {
        let units = this.state.units;
        const { availableLimits } = this.state;
        // Grbl
        if (type === GRBL) {
          const { parserstate } = { ...state };
          const { modal = {} } = { ...parserstate };
          units = {
            'G20': IMPERIAL_UNITS,
            'G21': METRIC_UNITS
          }[modal.units] || units;
        }

        // Marlin
        if (type === MARLIN) {
          const { modal = {} } = { ...state };
          units = {
            'G20': IMPERIAL_UNITS,
            'G21': METRIC_UNITS
          }[modal.units] || units;
        }

        // Smoothie
        if (type === SMOOTHIE) {
          const { parserstate } = { ...state };
          const { modal = {} } = { ...parserstate };
          units = {
            'G20': IMPERIAL_UNITS,
            'G21': METRIC_UNITS
          }[modal.units] || units;
        }

        // TinyG
        if (type === TINYG) {
          const { sr } = { ...state };
          const { modal = {} } = { ...sr };
          units = {
            'G20': IMPERIAL_UNITS,
            'G21': METRIC_UNITS
          }[modal.units] || units;
        }

        if (this.state.units !== units) {
          // Set `this.unitsDidChange` to true if the unit has changed
          this.unitsDidChange = true;
        }

        let smallestSide = availableLimits.dx > availableLimits.dy ? availableLimits.dy : availableLimits.dx;

        let delta = Math.round(smallestSide / 5);

        this.setState({
          units: units,
          controller: {
            type: type,
            state: state
          },
          probeDepth: mapValueToUnits(this.config.get('probeDepth'), units),
          probeFeedrate: mapValueToUnits(this.config.get('probeFeedrate'), units),
          touchPlateHeight: mapValueToUnits(this.config.get('touchPlateHeight'), units),
          retractionDistance: mapValueToUnits(this.config.get('retractionDistance'), units),
          probeStartX: availableLimits.xmin,
          probeStartY: availableLimits.ymin,
          probeDeltaX: delta,
          probeDeltaY: delta,
          probeBedXLength: availableLimits.dx,
          probeBedYLength: availableLimits.dy
        });
      }
    };

    unitsDidChange = false;

    componentDidMount() {
      this.changeMachineProfile();
      store.on('change', this.changeMachineProfile);
      this.addControllerEvents();
    }

    componentWillUnmount() {
      this.removeControllerEvents();
    }

    componentDidUpdate(prevProps, prevState) {
      const {
        minimized
      } = this.state;

      this.config.set('minimized', minimized);

      // Do not save config settings if the units did change between in and mm
      if (this.unitsDidChange) {
        this.unitsDidChange = false;
        return;
      }

      const { units, probeCommand, useTLO } = this.state;
      this.config.set('probeCommand', probeCommand);
      this.config.set('useTLO', useTLO);

      let {
        probeDepth,
        probeFeedrate,
        touchPlateHeight,
        retractionDistance
      } = this.state;

      // To save in mm
      if (units === IMPERIAL_UNITS) {
        probeDepth = in2mm(probeDepth);
        probeFeedrate = in2mm(probeFeedrate);
        touchPlateHeight = in2mm(touchPlateHeight);
        retractionDistance = in2mm(retractionDistance);
      }
      this.config.set('probeDepth', Number(probeDepth));
      this.config.set('probeFeedrate', Number(probeFeedrate));
      this.config.set('touchPlateHeight', Number(touchPlateHeight));
      this.config.set('retractionDistance', Number(retractionDistance));
    }

    getInitialState() {
      return {
        minimized: this.config.get('minimized', false),
        isFullscreen: false,
        canClick: true, // Defaults to true
        port: controller.port,
        units: METRIC_UNITS,
        controller: {
          type: controller.type,
          state: controller.state
        },
        workflow: {
          state: controller.workflow.state
        },
        modal: {
          name: MODAL_NONE,
          params: {}
        },
        probeAxis: this.config.get('probeAxis', 'Z'),
        probeCommand: this.config.get('probeCommand', 'G38.2'),
        useTLO: this.config.get('useTLO'),
        probeDepth: Number(this.config.get('probeDepth') || 0) * 1,
        probeFeedrate: Number(this.config.get('probeFeedrate') || 0) * 1,
        touchPlateHeight: Number(this.config.get('touchPlateHeight') || 0) * 1,
        retractionDistance: Number(this.config.get('retractionDistance') || 0) * 1,
        limits: this.getLimits(),
        availableLimits: this.getLimits(true),
        determinedHeightInfo: this.getDeterminedHeightInfo(),
        probeStartX: 0,
        probeStartY: 0,
        probeDeltaX: 0,
        probeDeltaY: 0,
        probeBedXLength: 0,
        probeBedYLength: 0
      };
    }

    addControllerEvents() {
      Object.keys(this.controllerEvents).forEach(eventName => {
        const callback = this.controllerEvents[eventName];
        controller.addListener(eventName, callback);
      });
    }

    removeControllerEvents() {
      Object.keys(this.controllerEvents).forEach(eventName => {
        const callback = this.controllerEvents[eventName];
        controller.removeListener(eventName, callback);
      });
    }

    getWorkCoordinateSystem() {
      const controllerType = this.state.controller.type;
      const controllerState = this.state.controller.state;
      const defaultWCS = 'G54';

      if (controllerType === GRBL) {
        return get(controllerState, 'parserstate.modal.wcs') || defaultWCS;
      }

      if (controllerType === MARLIN) {
        return get(controllerState, 'modal.wcs') || defaultWCS;
      }

      if (controllerType === SMOOTHIE) {
        return get(controllerState, 'parserstate.modal.wcs') || defaultWCS;
      }

      if (controllerType === TINYG) {
        return get(controllerState, 'sr.modal.wcs') || defaultWCS;
      }

      return defaultWCS;
    }

    canClick() {
      const { port, workflow } = this.state;
      const controllerType = this.state.controller.type;
      const controllerState = this.state.controller.state;

      if (!port) {
        return false;
      }
      if (workflow.state !== WORKFLOW_STATE_IDLE) {
        return false;
      }
      if (!includes([GRBL, MARLIN, SMOOTHIE, TINYG], controllerType)) {
        return false;
      }
      if (controllerType === GRBL) {
        const activeState = get(controllerState, 'status.activeState');
        const states = [
          GRBL_ACTIVE_STATE_IDLE
        ];
        if (!includes(states, activeState)) {
          return false;
        }
      }
      if (controllerType === MARLIN) {
        // Marlin does not have machine state
      }
      if (controllerType === SMOOTHIE) {
        const activeState = get(controllerState, 'status.activeState');
        const states = [
          SMOOTHIE_ACTIVE_STATE_IDLE
        ];
        if (!includes(states, activeState)) {
          return false;
        }
      }
      if (controllerType === TINYG) {
        const machineState = get(controllerState, 'sr.machineState');
        const states = [
          TINYG_MACHINE_STATE_READY,
          TINYG_MACHINE_STATE_STOP,
          TINYG_MACHINE_STATE_END
        ];
        if (!includes(states, machineState)) {
          return false;
        }
      }

      return true;
    }

    changeMachineProfile = () => {
      this.limits = this.getLimits();
      this.setState({ limits: this.limits });

      this.availableLimits = this.getLimits(true);
      this.setState({ availableLimits: this.availableLimits });

      this.determinedHeightInfo = this.getDeterminedHeightInfo();
      this.setState({ determinedHeightInfo: this.determinedHeightInfo });
    }

    getDeterminedHeightInfo() {
      const machineProfile = store.get('workspace.machineProfile');
      if (machineProfile) {
        this.machineProfile = { ...machineProfile };
        const determinedHeightInfo = get(this.machineProfile, 'determinedHeightInfo');
        return determinedHeightInfo;
      }

      return null;
    }

    getLimits(available = false) {
      let limits = {
        xmin: 0,
        xmax: 0,
        ymin: 0,
        ymax: 0,
        zmin: 0,
        zmax: 0
      };

      const machineProfile = store.get('workspace.machineProfile');
      if (machineProfile) {
        this.machineProfile = { ...machineProfile };
        limits = get(this.machineProfile, 'limits');
      }

      const { xmin = 0, xmax = 0, ymin = 0, ymax = 0, zmin = 0, zmax = 0 } = { ...limits };
      const { availableXmin = 0, availableXmax = 0, availableYmin = 0, availableYmax = 0, availableZmin = 0, availableZmax = 0, } = { ...limits };

      if (available) {
        return this.createLimits(availableXmin, availableXmax, availableYmin, availableYmax, availableZmin, availableZmax);
      }

      return this.createLimits(xmin, xmax, ymin, ymax, zmin, zmax);
    }

    createLimits(xmin, xmax, ymin, ymax, zmin, zmax) {
      const dx = Math.abs(xmax - xmin) || Number.MIN_VALUE;
      const dy = Math.abs(ymax - ymin) || Number.MIN_VALUE;
      const dz = Math.abs(zmax - zmin) || Number.MIN_VALUE;

      const limits = {
        xmin,
        xmax,
        ymin,
        ymax,
        zmin,
        zmax,
        dx,
        dy,
        dz
      };

      return limits;
    }

    render() {
      const { widgetId } = this.props;
      const { minimized, isFullscreen } = this.state;
      const isForkedWidget = widgetId.match(/\w+:[\w\-]+/);
      const state = {
        ...this.state,
        canClick: this.canClick()
      };
      const actions = {
        ...this.actions
      };

      return (
        <Widget fullscreen={isFullscreen}>
          <Widget.Header>
            <Widget.Title>
              <Widget.Sortable className={this.props.sortable.handleClassName}>
                <i className="fa fa-bars" />
                <Space width="8" />
              </Widget.Sortable>
              {isForkedWidget &&
                <i className="fa fa-code-fork" style={{ marginRight: 5 }} />
              }
              {i18n._('Bed Level')}
            </Widget.Title>
            <Widget.Controls className={this.props.sortable.filterClassName}>
              <Widget.Button
                disabled={isFullscreen}
                title={minimized ? i18n._('Expand') : i18n._('Collapse')}
                onClick={actions.toggleMinimized}
              >
                <i
                  className={classNames(
                    'fa',
                    { 'fa-chevron-up': !minimized },
                    { 'fa-chevron-down': minimized }
                  )}
                />
              </Widget.Button>
              <Widget.DropdownButton
                title={i18n._('More')}
                toggle={<i className="fa fa-ellipsis-v" />}
                onSelect={(eventKey) => {
                  if (eventKey === 'fullscreen') {
                    actions.toggleFullscreen();
                  } else if (eventKey === 'fork') {
                    this.props.onFork();
                  } else if (eventKey === 'remove') {
                    this.props.onRemove();
                  }
                }}
              >
                <Widget.DropdownMenuItem eventKey="fullscreen">
                  <i
                    className={classNames(
                      'fa',
                      'fa-fw',
                      { 'fa-expand': !isFullscreen },
                      { 'fa-compress': isFullscreen }
                    )}
                  />
                  <Space width="4" />
                  {!isFullscreen ? i18n._('Enter Full Screen') : i18n._('Exit Full Screen')}
                </Widget.DropdownMenuItem>
                <Widget.DropdownMenuItem eventKey="fork">
                  <i className="fa fa-fw fa-code-fork" />
                  <Space width="4" />
                  {i18n._('Fork Widget')}
                </Widget.DropdownMenuItem>
                <Widget.DropdownMenuItem eventKey="remove">
                  <i className="fa fa-fw fa-times" />
                  <Space width="4" />
                  {i18n._('Remove Widget')}
                </Widget.DropdownMenuItem>
              </Widget.DropdownButton>
            </Widget.Controls>
          </Widget.Header>
          <Widget.Content
            className={classNames(
              styles['widget-content'],
              { [styles.hidden]: minimized }
            )}
          >
            {state.modal.name === MODAL_PREVIEW &&
              <RunBedLevel state={state} actions={actions} />
            }
            <BedLevel
              state={state}
              actions={actions}
            />
          </Widget.Content>
        </Widget>
      );
    }
}

export default BedLevelWidget;
