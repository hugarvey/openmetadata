/*
 *  Copyright 2021 Collate
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *  http://www.apache.org/licenses/LICENSE-2.0
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

import PropTypes from 'prop-types';
import React from 'react';
import Step from './Step';

const Stepper = ({ steps, isVertical, activeStep, showStepNumber }) => {
  return (
    <div
      className={`stepper-list stepper-${
        isVertical ? 'vertical' : 'horizontal'
      }`}>
      {steps.map(({ name }, index) => (
        <Step
          activeStep={activeStep}
          index={index}
          isVertical={isVertical}
          key={index}
          name={name}
          showStepNumber={showStepNumber}
          totalSteps={steps.length}
        />
      ))}
    </div>
  );
};

Stepper.defaultProps = {
  activeStep: 0,
  showStepNumber: true,
};

Stepper.propTypes = {
  steps: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
    })
  ).isRequired,
  isVertical: PropTypes.bool,
  activeStep: PropTypes.number,
  showStepNumber: PropTypes.bool,
};

export default Stepper;
