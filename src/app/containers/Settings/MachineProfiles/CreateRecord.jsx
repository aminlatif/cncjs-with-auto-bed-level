import _get from 'lodash/get';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Form, Field } from 'react-final-form';
import { Input } from 'app/components/FormControl';
import FormGroup from 'app/components/FormGroup';
import { FlexContainer, Row, Col } from 'app/components/GridSystem';
import Margin from 'app/components/Margin';
import Modal from 'app/components/Modal';
import { ToastNotification } from 'app/components/Notifications';
import SectionGroup from 'app/components/SectionGroup';
import SectionTitle from 'app/components/SectionTitle';
import i18n from 'app/lib/i18n';
import Error from '../common/Error';
import * as validations from '../common/validations';
import Axis from './Axis';

class CreateRecord extends Component {
    static propTypes = {
      state: PropTypes.object,
      actions: PropTypes.object
    };

    state = this.getInitialState();

    getInitialState() {
      return {
        values: {
          name: '',
          heightInfo: '',
          limits: {
            xmin: 0,
            xmax: 0,
            ymin: 0,
            ymax: 0,
            zmin: 0,
            zmax: 0,
            availableXmin: 0,
            availableXmax: 0,
            availableYmin: 0,
            availableYmax: 0,
            availableZmin: 0,
            availableZmax: 0
          }
        }
      };
    }

    onSubmit = (values) => {
      const { createRecord } = this.props.actions;

      const newXmin = Number(_get(values, 'limits.xmin')) || 0;
      const newXmax = Number(_get(values, 'limits.xmax')) || 0;
      const newYmin = Number(_get(values, 'limits.ymin')) || 0;
      const newYmax = Number(_get(values, 'limits.ymax')) || 0;
      const newZmin = Number(_get(values, 'limits.zmin')) || 0;
      const newZmax = Number(_get(values, 'limits.zmax')) || 0;
      let newAvailableXmin = Number(_get(values, 'limits.availableXmin')) || 0;
      let newAvailableXmax = Number(_get(values, 'limits.availableXmax')) || 0;
      let newAvailableYmin = Number(_get(values, 'limits.availableYmin')) || 0;
      let newAvailableYmax = Number(_get(values, 'limits.availableYmax')) || 0;
      let newAvailableZmin = Number(_get(values, 'limits.availableZmin')) || 0;
      let newAvailableZmax = Number(_get(values, 'limits.availableZmax')) || 0;

      if (newAvailableXmin < newXmin) {
        newAvailableXmin = newXmin;
      }
      if (newAvailableXmax > newXmax) {
        newAvailableXmax = newXmax;
      }
      if (newAvailableYmin < newYmin) {
        newAvailableYmin = newYmin;
      }
      if (newAvailableYmax > newYmax) {
        newAvailableYmax = newYmax;
      }
      if (newAvailableZmin < newZmin) {
        newAvailableZmin = newZmin;
      }
      if (newAvailableZmax > newZmax) {
        newAvailableZmax = newZmax;
      }

      const newRecord = {
        name: _get(values, 'name', ''),
        heightInfo: _get(values, 'heightInfo', ''),
        limits: {
          xmin: newXmin,
          xmax: newXmax,
          ymin: newYmin,
          ymax: newYmax,
          zmin: newZmin,
          zmax: newZmax,
          availableXmin: newAvailableXmin,
          availableXmax: newAvailableXmax,
          availableYmin: newAvailableYmin,
          availableYmax: newAvailableYmax,
          availableZmin: newAvailableZmin,
          availableZmax: newAvailableZmax
        }
      };

      createRecord(newRecord);
    };

    renderLimits = () => (
      <FlexContainer fluid gutterWidth={0}>
        <Row>
          <Col>
            <Field name="limits.xmin">
              {({ input, meta }) => (
                <FormGroup>
                  <label><Axis value="X" sub="min" /></label>
                  <Input {...input} type="number" />
                  {meta.touched && meta.error && <Error>{meta.error}</Error>}
                </FormGroup>
              )}
            </Field>
          </Col>
          <Col width="auto" style={{ width: 16 }} />
          <Col>
            <Field name="limits.xmax">
              {({ input, meta }) => (
                <FormGroup>
                  <label><Axis value="X" sub="max" /></label>
                  <Input {...input} type="number" />
                  {meta.touched && meta.error && <Error>{meta.error}</Error>}
                </FormGroup>
              )}
            </Field>
          </Col>
        </Row>
        <Row>
          <Col>
            <Field name="limits.ymin">
              {({ input, meta }) => (
                <FormGroup>
                  <label><Axis value="Y" sub="min" /></label>
                  <Input {...input} type="number" />
                  {meta.touched && meta.error && <Error>{meta.error}</Error>}
                </FormGroup>
              )}
            </Field>
          </Col>
          <Col width="auto" style={{ width: 16 }} />
          <Col>
            <Field name="limits.ymax">
              {({ input, meta }) => (
                <FormGroup>
                  <label><Axis value="Y" sub="max" /></label>
                  <Input {...input} type="number" />
                  {meta.touched && meta.error && <Error>{meta.error}</Error>}
                </FormGroup>
              )}
            </Field>
          </Col>
        </Row>
        <Row>
          <Col>
            <Field name="limits.zmin">
              {({ input, meta }) => (
                <FormGroup>
                  <label><Axis value="Z" sub="min" /></label>
                  <Input {...input} type="number" />
                  {meta.touched && meta.error && <Error>{meta.error}</Error>}
                </FormGroup>
              )}
            </Field>
          </Col>
          <Col width="auto" style={{ width: 16 }} />
          <Col>
            <Field name="limits.zmax">
              {({ input, meta }) => (
                <FormGroup>
                  <label><Axis value="Z" sub="max" /></label>
                  <Input {...input} type="number" />
                  {meta.touched && meta.error && <Error>{meta.error}</Error>}
                </FormGroup>
              )}
            </Field>
          </Col>
        </Row>
      </FlexContainer>
    );

    renderAvailableLimits = () => (
      <FlexContainer fluid gutterWidth={0}>
        <Row>
          <Col>
            <Field name="limits.availableXmin">
              {({ input, meta }) => (
                <FormGroup>
                  <label><Axis value="A X" sub="min" /></label>
                  <Input {...input} type="number" />
                  {meta.touched && meta.error && <Error>{meta.error}</Error>}
                </FormGroup>
              )}
            </Field>
          </Col>
          <Col width="auto" style={{ width: 16 }} />
          <Col>
            <Field name="limits.availableXmax">
              {({ input, meta }) => (
                <FormGroup>
                  <label><Axis value="A X" sub="max" /></label>
                  <Input {...input} type="number" />
                  {meta.touched && meta.error && <Error>{meta.error}</Error>}
                </FormGroup>
              )}
            </Field>
          </Col>
        </Row>
        <Row>
          <Col>
            <Field name="limits.availableYmin">
              {({ input, meta }) => (
                <FormGroup>
                  <label><Axis value="A Y" sub="min" /></label>
                  <Input {...input} type="number" />
                  {meta.touched && meta.error && <Error>{meta.error}</Error>}
                </FormGroup>
              )}
            </Field>
          </Col>
          <Col width="auto" style={{ width: 16 }} />
          <Col>
            <Field name="limits.availableYmax">
              {({ input, meta }) => (
                <FormGroup>
                  <label><Axis value="A Y" sub="max" /></label>
                  <Input {...input} type="number" />
                  {meta.touched && meta.error && <Error>{meta.error}</Error>}
                </FormGroup>
              )}
            </Field>
          </Col>
        </Row>
        <Row>
          <Col>
            <Field name="limits.availableZmin">
              {({ input, meta }) => (
                <FormGroup>
                  <label><Axis value="A Z" sub="min" /></label>
                  <Input {...input} type="number" />
                  {meta.touched && meta.error && <Error>{meta.error}</Error>}
                </FormGroup>
              )}
            </Field>
          </Col>
          <Col width="auto" style={{ width: 16 }} />
          <Col>
            <Field name="limits.availableZmax">
              {({ input, meta }) => (
                <FormGroup>
                  <label><Axis value="A Z" sub="max" /></label>
                  <Input {...input} type="number" />
                  {meta.touched && meta.error && <Error>{meta.error}</Error>}
                </FormGroup>
              )}
            </Field>
          </Col>
        </Row>
      </FlexContainer>
    );

    render() {
      const { closeModal, updateModalParams } = this.props.actions;
      const { alertMessage } = this.props.state.modal.params;

      return (
        <Modal disableOverlay onClose={closeModal}>
          <Form
            initialValues={this.state.values}
            onSubmit={this.onSubmit}
            render={({ handleSubmit, pristine, invalid }) => (
              <div>
                <Modal.Header>
                  <Modal.Title>
                    {i18n._('Machine Profile')}
                  </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  {alertMessage && (
                    <ToastNotification
                      style={{ margin: '-16px -24px 10px -24px' }}
                      type="error"
                      onDismiss={() => {
                        updateModalParams({ alertMessage: '' });
                      }}
                    >
                      {alertMessage}
                    </ToastNotification>
                  )}
                  <SectionGroup>
                    <Field name="name" validate={validations.required}>
                      {({ input, meta }) => (
                        <FormGroup>
                          <label>{i18n._('Name')}</label>
                          <Input {...input} type="text" />
                          {meta.touched && meta.error && <Error>{meta.error}</Error>}
                        </FormGroup>
                      )}
                    </Field>
                    <Field name="heightInfo">
                      {({ input, meta }) => (
                        <FormGroup>
                          <label>{i18n._('Height Info')}</label>
                          <br />
                          <textarea {...input} style={{ width: '100%', minHeight: '150px' }} />
                          {meta.touched && meta.error && <Error>{meta.error}</Error>}
                        </FormGroup>
                      )}
                    </Field>
                  </SectionGroup>
                  <SectionGroup style={{ marginBottom: 0 }}>
                    <SectionTitle>{i18n._('Limits')}</SectionTitle>
                    <Margin left={24}>
                      {this.renderLimits()}
                    </Margin>
                  </SectionGroup>
                  <SectionGroup style={{ marginBottom: 0 }}>
                    <SectionTitle>{i18n._('Available Limits')}</SectionTitle>
                    <Margin left={24}>
                      {this.renderAvailableLimits()}
                    </Margin>
                  </SectionGroup>
                </Modal.Body>
                <Modal.Footer>
                  <button
                    type="button"
                    className="btn btn-default"
                    onClick={closeModal}
                  >
                    {i18n._('Cancel')}
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={pristine || invalid}
                    onClick={handleSubmit}
                  >
                    {i18n._('OK')}
                  </button>
                </Modal.Footer>
              </div>
            )}
          />
        </Modal>
      );
    }
}

export default CreateRecord;
