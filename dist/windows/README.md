MSI Package Knowledge Base

==============================================

For now, as 20130613, we will have the binaries in the folder __dirname/dist/windows/bin. (In the respective branch win-msi).

In the future, let's only have the links to these files mentioned.

Currently you need:

* Wix
* Paraffine (for fragment creation, there are +1000 files to be indexed)

# Files involved

## make_installer.cmd

(TODO)

## main.wxs

(TODO)

# Problemas a resolver


- Tenemos que resolver el problema de la version (poner 0.10.0 y que quede bien)
- Tenemos que resolver el problema de llamar a:
	 - config activate
	 - post install
	 - config gui
- despues arreglar la gui
- despues instalar .NET si no lo tiene
- agregar un icono a la instalación de prey