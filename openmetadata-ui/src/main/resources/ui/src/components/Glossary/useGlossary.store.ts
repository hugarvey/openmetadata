/*
 *  Copyright 2024 Collate.
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
import { create } from 'zustand';
import { Glossary } from '../../generated/entity/data/glossary';
import { GlossaryTermWithChildren } from '../../rest/glossaryAPI';

export type ModifiedGlossary = Glossary & {
  children?: GlossaryTermWithChildren[];
};

export const useGlossaryStore = create<{
  glossaries: Glossary[];
  activeGlossary: ModifiedGlossary;
  setGlossaries: (glossaries: Glossary[]) => void;
  setActiveGlossary: (glossary: ModifiedGlossary) => void;
  updateGlossary: (glossary: Glossary) => void;
  updateActiveGlossary: (glossary: Partial<ModifiedGlossary>) => void;
}>()((set, get) => ({
  glossaries: [],
  activeGlossary: {} as ModifiedGlossary,

  setGlossaries: (glossaries: Glossary[]) => {
    set({ glossaries });
  },
  updateGlossary: (glossary: Glossary) => {
    const { glossaries } = get();

    const newGlossaries = glossaries.map((g) =>
      g.fullyQualifiedName === glossary.fullyQualifiedName ? glossary : g
    );

    set({ glossaries: newGlossaries });
  },
  setActiveGlossary: (glossary: ModifiedGlossary) => {
    set({ activeGlossary: glossary });
  },
  updateActiveGlossary: (glossary: Partial<ModifiedGlossary>) => {
    const { activeGlossary } = get();

    set({ activeGlossary: { ...activeGlossary, ...glossary } as Glossary });
  },
}));
