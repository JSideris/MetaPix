Syntax
======

#Lines#

Lines will be in the form of an assignment or a function call with parameters. Parameters are comma separated.

>x = 123

>Cone 5, 20, 32

#Blocks#

Every function call is its own block of code that may contain child lines. The children of each line are also lines, but indented.

Nested blocks are possible. 

Example:

>Outer1
>	Nested1
>	Nested2
>		Nested_Deeper
>	Nested3
>Outer2

#Variables#

Assignments are done by declaring a variable name followed by "=" followed by an expression or line.

>x = 5

>y = Box 1, 1, 1

#Data Types#

Currently supported primitive data types are numeric, boolean, or null. These data types correspond to JavaScript data types that they are compiled into.

More complex data types include geometry, group, material, etc.

Array and string data types are currently not supported. Square brackets are reserved for arrays in a future version of MetaThree.

#Names#

Keep names a-z, A-Z, 0-9. Names must not start with a number.


Functions
=========

#Flow Control#

Use if statements to execute child lines if a condition has truthiness.

>If condition
>	Lines
>	Lines

There are no loops in MetaThree. However, there are array groups, explained below. Recursion is another technique that is possible through the use of templates.

#Templates#

Templates are the equivalent of custom functions. A template is not called when it is defined. It is called later. Calling a template will return a group containing the internal geometry, or null.

>MyCube = Template size position
>	Box size, size, size
>		Pos position, 0, 0
>MyCube 1, -5
>MyCube 2, 0
>MyCube 3, 5

Recursion is also possible.

>MyStack = Template size, 