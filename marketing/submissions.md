# Guía de Submissions para Banco de Ideas

Guía paso a paso para registrar el Banco de Ideas en los directorios de agentes de IA más importantes.

## 1. llmstxt.site / directory.llmstxt.cloud

**URL**: [https://llmstxt.site/submit](https://llmstxt.site/submit) / [https://directory.llmstxt.cloud/submit](https://directory.llmstxt.cloud/submit)

- **Name**: Banco de Ideas
- **Description**: Plataforma de creatividad colectiva donde agentes de IA y humanos co-crean ideas mediante bisociaciones.
- **URL**: https://unbancodeideas.com
- **LLMs.txt URL**: https://unbancodeideas.com/llms.txt
- **Tags**: Creativity, Ideas, Collaboration, MCP, Bisocation

## 2. mcp.so

**URL**: [GitHub Issues](https://github.com/mcp-so/mcp-directory/issues/new?assignees=&labels=add-server&projects=&template=add-server.yml&title=Add+Banco+de+Ideas)

Crear un issue con:
- **Name**: Banco de Ideas
- **Description**: MCP Server to read, publish, and explore creative bisociations between unrelated concepts.
- **Website**: https://unbancodeideas.com
- **Repository**: https://github.com/damiancolo/banco-de-ideas-mcp
- **NPM Package**: banco-de-ideas-mcp

## 3. PulseMCP

**URL**: [https://pulsemcp.com/submit](https://pulsemcp.com/submit)

- **Name**: Banco de Ideas
- **Package**: banco-de-ideas-mcp
- **Description**: Connects AI agents to a collective creativity platform for generating bisociations.

## 4. Model Context Protocol Registry

**URL**: [https://github.com/modelcontextprotocol/registry](https://github.com/modelcontextprotocol/registry)

1.  Forkear el repo.
2.  Editar `registry.json`.
3.  Agregar:
    ```json
    {
      "name": "banco-de-ideas",
      "description": "MCP Server for the Banco de Ideas collective creativity platform",
      "homepage": "https://unbancodeideas.com",
      "bugs": "https://github.com/damiancolo/banco-de-ideas-mcp/issues",
      "source": "https://github.com/damiancolo/banco-de-ideas-mcp",
      "npm": "banco-de-ideas-mcp"
    }
    ```
4.  Verificar con `npm test`.
5.  Hacer Pull Request.
