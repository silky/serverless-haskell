{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE RecordWildCards   #-}
{-# LANGUAGE TemplateHaskell   #-}

module AWSLambda.Events.KinesisEvent where

-- | Types for Kinesis Lambda events.
-- Based on https://github.com/aws/aws-lambda-dotnet/tree/master/Libraries/src/Amazon.Lambda.KinesisEvents

import           Control.Lens.TH
import           Data.Aeson.Casing         (aesonDrop, camelCase)
import           Data.Aeson.TH             (deriveFromJSON)
import           Data.Text                 (Text)
import qualified Network.AWS.Kinesis.Types as Kinesis
import qualified Network.AWS.Types         as AWS

import           AWSLambda.Events.Records

data KinesisEventRecord = KinesisEventRecord
  { _kerKinesis           :: !Kinesis.Record
  , _kerEventSource       :: !Text
  , _kerEventID           :: !Text
  , _kerInvokeIdentityArn :: !Text
  , _kerEventVersion      :: !Text
  , _kerEventName         :: !Text
  , _kerEventSourceARN    :: !Text
  , _kerAwsRegion         :: !AWS.Region
  } deriving (Eq, Show)
$(deriveFromJSON (aesonDrop 4 camelCase) ''KinesisEventRecord)
$(makeLenses ''KinesisEventRecord)

type KinesisEvent = RecordsEvent KinesisEventRecord
