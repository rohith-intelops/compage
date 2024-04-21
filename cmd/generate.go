package cmd

import (
	ociregistry "github.com/intelops/compage/cmd/artifacts"
	"github.com/intelops/compage/cmd/models"
	"github.com/intelops/compage/internal/converter/cmd"
	"github.com/intelops/compage/internal/handlers"
	"github.com/intelops/compage/internal/utils"
	log "github.com/sirupsen/logrus"
	"github.com/spf13/cobra"
	"os"
	"path/filepath"
)

// generateCmd represents the generate command
var generateCmd = &cobra.Command{
	Use:   "generate",
	Short: "Generates the code for the given configuration",
	Long: `This will generate the code for the given configuration. The configuration file is a yaml file that contains the configuration that guides the compage to generate the code.

Change the file as per your needs and then run the compage generate command to generate the code.`,
	Run: func(cmd *cobra.Command, args []string) {
		wD, err := os.Getwd()
		if err != nil {
			log.Errorf("error while getting the current directory [" + err.Error() + "]")
			return
		}
		// set the project directory environment variable, if this is set, then the project will be generated in this folder
		err = os.Setenv("COMPAGE_GENERATED_PROJECT_DIRECTORY", wD)
		if err != nil {
			log.Errorf("error while setting the project directory [" + err.Error() + "]")
			return
		}

		err = GenerateCode()
		cobra.CheckErr(err)
	},
}

func init() {
	rootCmd.AddCommand(generateCmd)
	// Here you will define your flags and configuration settings.

	// Cobra supports Persistent Flags which will work for this command
	// and all subcommands, e.g.:
	// generateCmd.PersistentFlags().String("foo", "", "A help for foo")

	// Cobra supports local flags which will only run when this command
	// is called directly, e.g.:
	// generateCmd.Flags().BoolP("toggle", "t", false, "Help message for toggle")
}

func GenerateCode() error {
	// Read the file from the current directory and convert it to project
	project, err := models.ReadConfigYAMLFile("config.yaml")
	cobra.CheckErr(err)

	// converts to core project
	coreProject, err := cmd.GetProject(project)
	if err != nil {
		log.Errorf("error while converting request to project [" + err.Error() + "]")
		return err
	}

	if len(coreProject.License.Path) > 0 {
		// assign absolute path to the license file Path if it's not
		absPath, err := filepath.Abs(coreProject.License.Path)
		if err != nil {
			log.Errorf("error while getting absolute path [" + err.Error() + "]")
			return err
		}
		coreProject.License.Path = absPath
	}

	// assign absolute path to the license file path if it's not (if supplied for the nodes)
	for _, node := range coreProject.CompageJSON.Nodes {
		if len(node.License.Path) > 0 {
			absPath, err := filepath.Abs(node.License.Path)
			if err != nil {
				log.Errorf("error while getting absolute path [" + err.Error() + "]")
				return err
			}
			node.License.Path = absPath
		}
	}

	// pull all required templates
	// pull the common templates
	err = ociregistry.PullOCIArtifact("common", project.Version)
	if err != nil {
		log.Errorf("error while pulling the common templates [" + err.Error() + "]")
		return err
	}
	for _, node := range coreProject.CompageJSON.Nodes {
		// make sure that the latest template is pulled
		err = ociregistry.PullOCIArtifact(node.Language, project.Version)
		if err != nil {
			log.Errorf("error while pulling the template [" + err.Error() + "]")
			return err
		}
		log.Debugf("template pulled successfully for language %s", node.Language)
	}

	// triggers project generation, process the request
	err0 := handlers.Handle(coreProject)
	if err0 != nil {
		log.Errorf("error while generating the project [" + err0.Error() + "]")
		return err
	}
	log.Infof("project generated successfully at %s", utils.GetProjectDirectoryName(project.Name))
	return nil
}
