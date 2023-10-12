/*
 *  Copyright 2023 Collate.
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
import React, {
  createContext,
  FC,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { LogoConfiguration } from '../../generated/configuration/applicationConfiguration';
import { EntityReference } from '../../generated/entity/type';
import { getCustomLogoConfig } from '../../rest/settingConfigAPI';

interface ContextConfig extends LogoConfiguration {
  routeElements?: ReactNode;
  sideBarElements?: ReactNode;
  selectedPersona: EntityReference;
  updateSelectedPersona: (personaFqn: EntityReference) => void;
}

export const ApplicationConfigContext = createContext<ContextConfig>(
  {} as ContextConfig
);

export const useApplicationConfigContext = () =>
  useContext(ApplicationConfigContext);

interface ApplicationConfigProviderProps {
  children: ReactNode;
  routeElements?: ReactNode;
  sideBarElements?: ReactNode;
}

const ApplicationConfigProvider: FC<ApplicationConfigProviderProps> = ({
  children,
  routeElements,
  sideBarElements,
}) => {
  const [applicationConfig, setApplicationConfig] = useState<LogoConfiguration>(
    {} as LogoConfiguration
  );
  const [selectedPersona, setSelectedPersona] = useState<EntityReference>(
    {} as EntityReference
  );

  const fetchApplicationConfig = async () => {
    try {
      const data = await getCustomLogoConfig();

      setApplicationConfig({
        ...data,
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
    }
  };

  const updateSelectedPersona = useCallback((persona: EntityReference) => {
    setSelectedPersona(persona);
  }, []);

  useEffect(() => {
    fetchApplicationConfig();
  }, []);

  const contextValue = useMemo(
    () => ({
      ...applicationConfig,
      routeElements,
      sideBarElements,
      selectedPersona,
      updateSelectedPersona,
    }),
    [
      applicationConfig,
      routeElements,
      sideBarElements,
      selectedPersona,
      updateSelectedPersona,
    ]
  );

  return (
    <ApplicationConfigContext.Provider value={contextValue}>
      {children}
    </ApplicationConfigContext.Provider>
  );
};

export default ApplicationConfigProvider;
