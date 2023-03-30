package handlers

import (
	"context"
	"github.com/intelops/compage/core/internal/core"
	"github.com/intelops/compage/core/internal/languages"
	"github.com/intelops/compage/core/internal/languages/golang"
	"github.com/intelops/compage/core/internal/languages/java"
	"github.com/intelops/compage/core/internal/languages/javascript"
	"github.com/intelops/compage/core/internal/languages/python"
	"github.com/intelops/compage/core/internal/languages/rust"
	"github.com/intelops/compage/core/internal/languages/typescript"
	"github.com/intelops/compage/core/internal/utils"
	log "github.com/sirupsen/logrus"
)

// Handle called from gRPC
func Handle(coreProject *core.Project) error {
	// create a directory with project name to contain code generated by core.
	projectDirectory := utils.GetProjectDirectoryName(coreProject.Name)
	if err := utils.CreateDirectories(projectDirectory); err != nil {
		return err
	}

	// Iterate over all nodes and generate code for all nodes.
	compageJson := coreProject.CompageJson
	for _, compageNode := range compageJson.Nodes {
		log.Debugf("processing node ID : %s ", compageNode.ID)

		// convert node to languageNode
		languageNode, err := languages.NewLanguageNode(compageJson, compageNode)
		if err != nil {
			// return errors like certain protocols aren't yet supported
			log.Debugf("err : %s", err)
			return err
		}

		// add values(LanguageNode and configs from coreProject) to context.
		languageCtx := languages.AddValuesToContext(context.Background(), coreProject, languageNode)

		// extract nodeDirectoryName for formatter
		values := languageCtx.Value(languages.LanguageContextVars).(languages.Values)
		nodeDirectoryName := values.NodeDirectoryName

		// create node directory in projectDirectory depicting a subproject
		if err0 := utils.CreateDirectories(nodeDirectoryName); err0 != nil {
			log.Debugf("err : %s", err0)
			return err0
		}

		// process golang
		if languageNode.Language == languages.Go {
			// add values(LanguageNode and configs from coreProject) to context.
			goCtx := golang.AddValuesToContext(languageCtx)
			if err1 := golang.Process(goCtx); err1 != nil {
				log.Debugf("err : %s", err1)
				return err1
			}
		} else if languageNode.Language == languages.Python {
			// add values(LanguageNode and configs from coreProject) to context.
			pythonCtx := python.AddValuesToContext(languageCtx)
			if err1 := python.Process(pythonCtx); err1 != nil {
				log.Debugf("err : %s", err1)
				return err1
			}
		} else if languageNode.Language == languages.Java {
			// add values(LanguageNode and configs from coreProject) to context.
			javaCtx := java.AddValuesToContext(languageCtx)
			if err1 := java.Process(javaCtx); err1 != nil {
				log.Debugf("err : %s", err1)
				return err1
			}
		} else if languageNode.Language == languages.Rust {
			// add values(LanguageNode and configs from coreProject) to context.
			rustCtx := rust.AddValuesToContext(languageCtx)
			if err1 := rust.Process(rustCtx); err1 != nil {
				log.Debugf("err : %s", err1)
				return err1
			}
		} else if languageNode.Language == languages.JavaScript {
			// add values(LanguageNode and configs from coreProject) to context.
			javascriptCtx := javascript.AddValuesToContext(languageCtx)
			if err1 := javascript.Process(javascriptCtx); err1 != nil {
				log.Debugf("err : %s", err1)
				return err1
			}
		} else if languageNode.Language == languages.TypeScript {
			// add values(LanguageNode and configs from coreProject) to context.
			typescriptCtx := typescript.AddValuesToContext(languageCtx)
			if err1 := typescript.Process(typescriptCtx); err1 != nil {
				log.Debugf("err : %s", err1)
				return err1
			}
		}
	}

	return nil
}
