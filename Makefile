.DEFAULT_GOAL := help
PY_SOURCE ?= ingestion/src
include ingestion/Makefile

.PHONY: help
help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[35m%-30s\033[0m %s\n", $$1, $$2}'

.PHONY: install_e2e_tests
install_e2e_tests:  ## Install the ingestion module with e2e test dependencies (playwright)
	python -m pip install "ingestion[e2e_test]/"
	playwright install --with-deps

.PHONY: run_e2e_tests
run_e2e_tests: ## Run e2e tests
	pytest --screenshot=only-on-failure --output="ingestion/tests/e2e/artifacts" $(ARGS) --junitxml=ingestion/junit/test-results-e2e.xml ingestion/tests/e2e

## Yarn
.PHONY: yarn_install_cache
yarn_install_cache:  ## Use Yarn to install UI dependencies
	cd openmetadata-ui/src/main/resources/ui && yarn install --frozen-lockfile

.PHONY: yarn_start_dev_ui
yarn_start_dev_ui:  ## Run the UI locally with Yarn
	cd openmetadata-ui/src/main/resources/ui && yarn start

## Ingestion Core
.PHONY: core_install_dev
core_install_dev:  ## Prepare a venv for the ingestion-core module
	cd ingestion-core; \
		rm -rf venv; \
		python3 -m venv venv; \
		. venv/bin/activate; \
		python3 -m pip install ".[dev]"

.PHONY: core_clean
core_clean:  ## Clean the ingestion-core generated files
	rm -rf ingestion-core/src/metadata/generated
	rm -rf ingestion-core/build
	rm -rf ingestion-core/dist

.PHONY: core_generate
core_generate:  ## Generate the pydantic models from the JSON Schemas to the ingestion-core module
	$(MAKE) core_install_dev
	mkdir -p ingestion-core/src/metadata/generated; \
	. ingestion-core/venv/bin/activate; \
	datamodel-codegen --input openmetadata-spec/src/main/resources/json/schema  --input-file-type jsonschema --output ingestion-core/src/metadata/generated/schema
	$(MAKE) core_py_antlr

.PHONY: core_bump_version_dev
core_bump_version_dev:  ## Bump a `dev` version to the ingestion-core module. To be used when schemas are updated
	$(MAKE) core_install_dev
	cd ingestion-core; \
		. venv/bin/activate; \
		python -m incremental.update metadata --dev

.PHONY: core_py_antlr
core_py_antlr:  ## Generate the Python core code for parsing FQNs under ingestion-core
	antlr4 -Dlanguage=Python3 -o ingestion-core/src/metadata/generated/antlr ${PWD}/openmetadata-spec/src/main/antlr4/org/openmetadata/schema/*.g4

.PHONY: py_antlr
py_antlr:  ## Generate the Python code for parsing FQNs
	antlr4 -Dlanguage=Python3 -o ingestion/src/metadata/generated/antlr openmetadata-spec/src/main/antlr4/org/openmetadata/schema/*.g4

.PHONY: js_antlr
js_antlr:  ## Generate the Python code for parsing FQNs
	antlr4 -Dlanguage=JavaScript -o openmetadata-ui/src/main/resources/ui/src/generated/antlr openmetadata-spec/src/main/antlr4/org/openmetadata/schema/*.g4

.PHONY: install_antlr_cli
install_antlr_cli:  ## Install antlr CLI locally
	echo '#!/usr/bin/java -jar' > /usr/local/bin/antlr4
	curl https://www.antlr.org/download/antlr-4.9.2-complete.jar >> /usr/local/bin/antlr4
	chmod 755 /usr/local/bin/antlr4

.PHONY: docker-docs-local
docker-docs-local:  ## Runs the OM docs in docker with a local image
	docker run --name openmetadata-docs -p 3000:3000 -v ${PWD}/openmetadata-docs/content:/docs/content/ -v ${PWD}/openmetadata-docs/images:/docs/public/images openmetadata-docs:local yarn dev

.PHONY: docker-docs
docker-docs:  ## Runs the OM docs in docker passing openmetadata-docs-v1 as volume for content and images
	docker pull openmetadata/docs:latest
	docker run --name openmetadata-docs -p 3000:3000 -v ${PWD}/openmetadata-docs/content:/docs/content/ -v ${PWD}/openmetadata-docs/images:/docs/public/images openmetadata/docs:latest yarn dev

.PHONY: docker-docs-validate
docker-docs-validate:  ## Runs the OM docs in docker passing openmetadata-docs as volume for content and images
	docker pull openmetadata/docs-v1:latest
	docker run --entrypoint '/bin/sh' -v ${PWD}/openmetadata-docs/content:/docs/content/ -v ${PWD}/openmetadata-docs/images:/docs/public/images openmetadata/docs:latest -c 'yarn build'

## SNYK
SNYK_ARGS := --severity-threshold=high

.PHONY: snyk-ingestion-report
snyk-ingestion-report:  ## Uses Snyk CLI to validate the ingestion code and container. Don't stop the execution
	@echo "Validating Ingestion container..."
	docker build -t openmetadata-ingestion:scan -f ingestion/Dockerfile .
	snyk container test openmetadata-ingestion:scan --file=ingestion/Dockerfile $(SNYK_ARGS) --json > security-report/ingestion-docker-scan.json | true;
	@echo "Validating ALL ingestion dependencies. Make sure the venv is activated."
	cd ingestion; \
		pip freeze > scan-requirements.txt; \
		snyk test --file=scan-requirements.txt --package-manager=pip --command=python3 $(SNYK_ARGS) --json > ../security-report/ingestion-dep-scan.json | true; \
		snyk code test $(SNYK_ARGS) --json > ../security-report/ingestion-code-scan.json | true;

.PHONY: snyk-airflow-apis-report
snyk-airflow-apis-report:  ## Uses Snyk CLI to validate the airflow apis code. Don't stop the execution
	@echo "Validating airflow dependencies. Make sure the venv is activated."
	cd openmetadata-airflow-apis; \
    	snyk code test $(SNYK_ARGS) --json > ../security-report/airflow-apis-code-scan.json | true;

.PHONY: snyk-catalog-report
snyk-server-report:  ## Uses Snyk CLI to validate the catalog code and container. Don't stop the execution
	@echo "Validating catalog container... Make sure the code is built and available under openmetadata-dist"
	docker build -t openmetadata-server:scan -f docker/development/Dockerfile .
	snyk container test openmetadata-server:scan --file=docker/development/Dockerfile $(SNYK_ARGS) --json > security-report/server-docker-scan.json | true;
	snyk test --all-projects $(SNYK_ARGS) --json > security-report/server-dep-scan.json | true;
	snyk code test --all-projects --severity-threshold=high --json > security-report/server-code-scan.json | true;

.PHONY: snyk-ui-report
snyk-ui-report:  ## Uses Snyk CLI to validate the UI dependencies. Don't stop the execution
	snyk test --file=openmetadata-ui/src/main/resources/ui/yarn.lock $(SNYK_ARGS) --json > security-report/ui-dep-scan.json | true;

.PHONY: snyk-dependencies-report
snyk-dependencies-report:  ## Uses Snyk CLI to validate the project dependencies: MySQL, Postgres and ES. Only local testing.
	@echo "Validating dependencies images..."
	snyk container test mysql/mysql-server:latest $(SNYK_ARGS) --json > security-report/mysql-scan.json | true;
	snyk container test postgres:latest $(SNYK_ARGS) --json > security-report/postgres-scan.json | true;
	snyk container test docker.elastic.co/elasticsearch/elasticsearch:7.10.2 $(SNYK_ARGS) --json > security-report/es-scan.json | true;

.PHONY: snyk-report
snyk-report:  ## Uses Snyk CLI to run a security scan of the different pieces of the code
	@echo "To run this locally, make sure to install and authenticate using the Snyk CLI: https://docs.snyk.io/snyk-cli/install-the-snyk-cli"
	rm -rf security-report
	mkdir -p security-report
	$(MAKE) snyk-ingestion-report
	$(MAKE) snyk-airflow-apis-report
	$(MAKE) snyk-server-report
	$(MAKE) snyk-ui-report
	$(MAKE)	export-snyk-pdf-report

.PHONY: export-snyk-pdf-report
export-snyk-pdf-report:  ## export json file from security-report/ to HTML
	@echo "Reading all results"
	npm install snyk-to-html -g
	ls security-report | xargs -I % snyk-to-html -i security-report/% -o security-report/%.html
	pip install pdfkit
	pip install PyPDF2
	python scripts/html_to_pdf.py

# Ingestion Operators
.PHONY: build-ingestion-base-local
build-ingestion-base-local:  ## Builds the ingestion DEV docker operator with the local ingestion files
	$(MAKE) install_dev generate
	docker build -f ingestion/operators/docker/Dockerfile-dev . -t openmetadata/ingestion-base:local

.PHONY: generate-schema-docs
generate-schema-docs:  ## Generates markdown files for documenting the JSON Schemas
	@echo "Generating Schema docs"
	python -m pip install "jsonschema2md"
	python scripts/generate_docs_schemas.py

#Upgrade release automation scripts below	
.PHONY: update_all
update_all: ## To update all the release related files run make update_all RELEASE_VERSION=2.2.2 PY_RELEASE_VERSION=2.2.2.2
	@echo "The release version is: $(RELEASE_VERSION)" ; \
	echo "The python metadata release version: $(PY_RELEASE_VERSION)" ; \
	$(MAKE) update_maven ; \
	$(MAKE) update_github_action_paths ; \
	$(MAKE) update_python_release_paths ; \
	$(MAKE) update_dockerfile_version ; \
	$(MAKE) update_ingestion_dockerfile_version ; \

#remove comment and use the below section when want to use this sub module "update_all" independently to update github actions
#make update_all RELEASE_VERSION=2.2.2 PY_RELEASE_VERSION=2.2.2.2

.PHONY: update_maven
update_maven: ## To update the common and pom.xml maven version
	@echo "Updating Maven projects to version $(RELEASE_VERSION)..."; \
	mvn versions:set -DnewVersion=$(RELEASE_VERSION)
#remove comment and use the below section when want to use this sub module "update_maven" independently to update github actions
#make update_maven RELEASE_VERSION=2.2.2


.PHONY: update_github_action_paths
update_github_action_paths: ## To update the github action ci docker files
	@echo "Updating docker github action release version to $(RELEASE_VERSION)... "; \
	file_paths="docker/docker-compose-quickstart/Dockerfile \
	            .github/workflows/docker-openmetadata-db.yml \
	            .github/workflows/docker-openmetadata-ingestion-base.yml \
	            .github/workflows/docker-openmetadata-ingestion.yml \
	            .github/workflows/docker-openmetadata-postgres.yml \
	            .github/workflows/docker-openmetadata-server.yml"; \
	for file_path in $$file_paths; do \
	    python3 scripts/update_version.py 1 $$file_path -s $(RELEASE_VERSION) ; \
	done; \
	file_paths1="docker/docker-compose-quickstart/Dockerfile"; \
	for file_path in $$file_paths1; do \
	    python3 scripts/update_version.py 4 $$file_path -s $(RELEASE_VERSION) ; \
	done

#remove comment and use the below section when want to use this sub module "update_github_action_paths" independently to update github actions
#make update_github_action_paths RELEASE_VERSION=2.2.2

.PHONY: update_python_release_paths
update_python_release_paths: ## To update the setup.py files
	file_paths="ingestion/setup.py \
				openmetadata-airflow-apis/setup.py"; \
	echo "Updating Python setup file versions to $(PY_RELEASE_VERSION)... "; \
	for file_path in $$file_paths; do \
	    python3 scripts/update_version.py 2 $$file_path -s $(PY_RELEASE_VERSION) ; \
	done
# Commented section for independent usage of the module update_python_release_paths independently to update github actions
#make update_python_release_paths PY_RELEASE_VERSION=2.2.2.2

.PHONY: update_dockerfile_version
update_dockerfile_version: ## To update the dockerfiles version
	@file_paths="docker/docker-compose-ingestion/docker-compose-ingestion-postgres.yml \
		     docker/docker-compose-ingestion/docker-compose-ingestion.yml \
		     docker/docker-compose-openmetadata/docker-compose-openmetadata.yml \
		     docker/docker-compose-quickstart/docker-compose-postgres.yml \
		     docker/docker-compose-quickstart/docker-compose.yml"; \
	echo "Updating docker github action release version to $(RELEASE_VERSION)... "; \
	for file_path in $$file_paths; do \
	    python3 scripts/update_version.py 3 $$file_path -s $(RELEASE_VERSION) ; \
	done
#remove comment and use the below section when want to use this sub module "update_dockerfile_version" independently to update github actions
#make update_dockerfile_version RELEASE_VERSION=2.2.2

.PHONY: update_ingestion_dockerfile_version
update_ingestion_dockerfile_version: ## To update the ingestion dockerfiles version
	@file_paths="ingestion/Dockerfile \
	             ingestion/operators/docker/Dockerfile"; \
	echo "Updating ingestion dockerfile release version to $(PY_RELEASE_VERSION)... "; \
	for file_path in $$file_paths; do \
	    python3 scripts/update_version.py 4 $$file_path -s $(PY_RELEASE_VERSION) ; \
	done
#remove comment and use the below section when want to use this sub module "update_ingestion_dockerfile_version" independently to update github actions
#make update_ingestion_dockerfile_version PY_RELEASE_VERSION=2.2.2.2

#Upgrade release automation scripts above
