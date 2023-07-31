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

package org.openmetadata.service.resources.tags;

import static org.openmetadata.schema.type.Include.NON_DELETED;

import com.google.common.cache.CacheBuilder;
import com.google.common.cache.CacheLoader;
import com.google.common.cache.LoadingCache;
import com.google.common.util.concurrent.UncheckedExecutionException;
import java.io.IOException;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import javax.annotation.CheckForNull;
import lombok.extern.slf4j.Slf4j;
import org.openmetadata.schema.entity.classification.Classification;
import org.openmetadata.schema.entity.classification.Tag;
import org.openmetadata.schema.entity.data.Glossary;
import org.openmetadata.schema.entity.data.GlossaryTerm;
import org.openmetadata.schema.type.TagLabel;
import org.openmetadata.schema.type.TagLabel.TagSource;
import org.openmetadata.service.Entity;
import org.openmetadata.service.exception.CatalogExceptionMessage;
import org.openmetadata.service.exception.EntityNotFoundException;
import org.openmetadata.service.util.FullyQualifiedName;

/**
 * Both GlossaryTerm and Tags are used for labeling entity. This class caches GlossaryTerm and Tags for quick look up.
 */
@Slf4j
public class TagLabelCache {
  // Tag fqn to Tag
  protected static final LoadingCache<String, Tag> TAG_CACHE =
      CacheBuilder.newBuilder().maximumSize(100).expireAfterWrite(2, TimeUnit.MINUTES).build(new TagLoader());
  // Classification name to Classification
  protected static final LoadingCache<String, Classification> CLASSIFICATION_CACHE =
      CacheBuilder.newBuilder().maximumSize(25).expireAfterWrite(2, TimeUnit.MINUTES).build(new ClassificationLoader());

  // Glossary term fqn to GlossaryTerm
  protected static final LoadingCache<String, GlossaryTerm> GLOSSARY_TERM_CACHE =
      CacheBuilder.newBuilder().maximumSize(100).expireAfterWrite(2, TimeUnit.MINUTES).build(new GlossaryTermLoader());

  // Glossary fqn to Glossary
  protected static final LoadingCache<String, Glossary> GLOSSARY_CACHE =
      CacheBuilder.newBuilder().maximumSize(25).expireAfterWrite(2, TimeUnit.MINUTES).build(new GlossaryLoader());

  private TagLabelCache() {
    // Private constructor for utility class
  }

  public static void cleanUp() {
    CLASSIFICATION_CACHE.cleanUp();
    TAG_CACHE.cleanUp();
    GLOSSARY_CACHE.cleanUp();
    GLOSSARY_TERM_CACHE.cleanUp();
  }

  public static Classification getClassification(String classificationName) {
    try {
      return CLASSIFICATION_CACHE.get(classificationName);
    } catch (ExecutionException | UncheckedExecutionException ex) {
      throw EntityNotFoundException.byMessage(
          CatalogExceptionMessage.entityNotFound(Entity.CLASSIFICATION, classificationName));
    }
  }

  public static Tag getTag(String tagFqn) {
    try {
      return TAG_CACHE.get(tagFqn);
    } catch (ExecutionException | UncheckedExecutionException ex) {
      throw EntityNotFoundException.byMessage(CatalogExceptionMessage.entityNotFound(Entity.TAG, tagFqn));
    }
  }

  public static Glossary getGlossary(String glossaryName) {
    try {
      return GLOSSARY_CACHE.get(glossaryName);
    } catch (ExecutionException | UncheckedExecutionException ex) {
      throw EntityNotFoundException.byMessage(CatalogExceptionMessage.entityNotFound(Entity.GLOSSARY, glossaryName));
    }
  }

  public static GlossaryTerm getGlossaryTerm(String glossaryTermFqn) {
    try {
      return GLOSSARY_TERM_CACHE.get(glossaryTermFqn);
    } catch (ExecutionException | UncheckedExecutionException ex) {
      throw EntityNotFoundException.byMessage(
          CatalogExceptionMessage.entityNotFound(Entity.GLOSSARY_TERM, glossaryTermFqn));
    }
  }

  public static String getDescription(TagLabel label) {
    if (label.getSource() == TagSource.CLASSIFICATION) {
      return getTag(label.getTagFQN()).getDescription();
    } else if (label.getSource() == TagSource.GLOSSARY) {
      return getGlossaryTerm(label.getTagFQN()).getDescription();
    } else {
      throw new IllegalArgumentException("Invalid source type " + label.getSource());
    }
  }

  /** Returns true if the parent of the tag label is mutually exclusive */
  public static boolean mutuallyExclusive(TagLabel label) {
    String[] fqnParts = FullyQualifiedName.split(label.getTagFQN());
    String parentFqn = FullyQualifiedName.getParentFQN(fqnParts);
    boolean rootParent = fqnParts.length == 2;
    if (label.getSource() == TagSource.CLASSIFICATION) {
      return rootParent
          ? getClassification(parentFqn).getMutuallyExclusive()
          : getTag(parentFqn).getMutuallyExclusive();
    } else if (label.getSource() == TagSource.GLOSSARY) {
      return rootParent
          ? getGlossary(parentFqn).getMutuallyExclusive()
          : getGlossaryTerm(parentFqn).getMutuallyExclusive();
    } else {
      throw new IllegalArgumentException("Invalid source type " + label.getSource());
    }
  }

  static class TagLoader extends CacheLoader<String, Tag> {
    @Override
    public Tag load(@CheckForNull String tagName) throws IOException {
      Tag tag = Entity.getEntityByName(Entity.TAG, tagName, "", NON_DELETED);
      LOG.info("Loaded tag {}:{}", tag.getName(), tag.getId());
      return tag;
    }
  }

  static class ClassificationLoader extends CacheLoader<String, Classification> {
    @Override
    public Classification load(@CheckForNull String classificationName) throws IOException {
      Classification classification =
          Entity.getEntityByName(Entity.CLASSIFICATION, classificationName, "", NON_DELETED);
      LOG.info("Loaded classification {}:{}", classification.getName(), classification.getId());
      return classification;
    }
  }

  static class GlossaryTermLoader extends CacheLoader<String, GlossaryTerm> {
    @Override
    public GlossaryTerm load(@CheckForNull String glossaryTermName) throws IOException {
      GlossaryTerm glossaryTerm = Entity.getEntityByName(Entity.GLOSSARY_TERM, glossaryTermName, "", NON_DELETED);
      LOG.info("Loaded glossaryTerm {}:{}", glossaryTerm.getName(), glossaryTerm.getId());
      return glossaryTerm;
    }
  }

  static class GlossaryLoader extends CacheLoader<String, Glossary> {
    @Override
    public Glossary load(@CheckForNull String glossaryName) throws IOException {
      Glossary glossary = Entity.getEntityByName(Entity.GLOSSARY, glossaryName, "", NON_DELETED);
      LOG.info("Loaded glossary {}:{}", glossary.getName(), glossary.getId());
      return glossary;
    }
  }
}
