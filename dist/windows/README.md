MSI Package Knowledge Base


==============================================

For now, as 20130613, we will have the binaries in the folder __dirname/dist/windows/bin. (In the respective branch win-msi).

In the future, let's only have the links to these files mentioned.

Currently you need:

* Wix
* Paraffine (for fragment creation, there are +1000 files to be indexed)

# Files involved

## make_installer.cmd

### Deleting previous file

(TODO) - Explain something on why you had files, and why do you need to delete them

### Paraffin

Paraffin creates a fragment, since we have about a thousand files in prey, we can't manually create the wix components, that's the need to create an intermediate .wxs file enclosed in a fragment. We do it with paraffin.

(TODO) - Show commands in paraffin

".\bin\paraffin" prey-msi.wxs ^
-nrd ^
-dir source-package ^
-alias source-package ^
-groupname prey-msi

nrd parameter - if it's not there, the directory would be included
alias - So we won't see the hard code directory route
groupname - the identificator of the fragment

...


## main.wxs

...........



(TODO)



# Creating on linux the first part

(TODO)

# Invoking the creator in windows

$ make_installer.cmd <version>

example

$ make_installer.cmd 0.10.0

Is important to put the version number!












# Problemas a resolver


- Tenemos que resolver el problema de llamar a:
	 - config activate
	 - post install
	 - config gui
- despues arreglar la gui del instalador
- despues instalar .NET si no lo tiene
- agregar un icono a la instalación de prey
- Aprender a instalar con el certificado

- Ah! y ser capaz de instalarlo del paquete previamente creado con los configurables de linux

- ¿Qué pasa si prey ya está instalado.....?
	- ver la versión, si es la misma no hacer nada
	- ofrecer actualizar o salir si son distintas

