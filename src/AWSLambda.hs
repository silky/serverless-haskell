{-|
Module      : AWSLambda.Handler
Stability   : experimental
Portability : POSIX

Tools for running Haskell on AWS Lambda.

= Usage

To deploy a Haskell function on AWS Lambda:

* Initialise a Serverless project in the same directory as your Stack-enabled
  package.

* Install @serverless-haskell@ plugin (/Warning/: not uploaded to NPM registry
  yet, install manually by cloning this repository and specifying its
  @serverless-plugin@ directory to @npm install@).

* Add the following to @serverless.yml@:

  > provider:
  >   name: aws
  >   runtime: nodejs6.10
  >
  > functions:
  >   myfunc:
  >     handler: mypackage.myfunc
  >     # Here, mypackage is the Haskell package name and myfunc is the executable
  >     # name as defined in the Cabal file
  >
  > plugins:
  >   - serverless-haskell

* Write your @main@ function using 'AWSLambda.lambdaMain'.

* Use @sls deploy@ to deploy the executable to AWS Lambda. __Note__: @sls deploy
  function@ is not supported.
-}
module AWSLambda
  ( Handler.lambdaMain
  , module AWSLambda.Events
  ) where

import qualified AWSLambda.Handler as Handler

import AWSLambda.Events
