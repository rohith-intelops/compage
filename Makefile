proto:
	if [ -d "gen/api/v1" ]; then rm -rf gen/api/v1; fi && mkdir -p ./gen && protoc --go_out=./gen --go-grpc_opt=paths=source_relative --go_opt=paths=source_relative --go-grpc_out=./gen api/v1/*.proto