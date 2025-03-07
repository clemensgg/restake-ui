import React, { useState, useEffect } from 'react';
import Moment from 'react-moment';
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import {
  Table,
} from 'react-bootstrap'

import Coins from './Coins';
import ProposalProgress from './ProposalProgress';
import VoteForm from './VoteForm';
import AlertMessage from './AlertMessage';
import Vote from '../utils/Vote.mjs';

function ProposalDetails(props) {
  const { proposal, tally, vote, network } = props
  const [granter, setGranter] = useState()
  const [granterVote, setGranterVote] = useState()
  const [error, setError] = useState()

  const { proposal_id, title, description } = proposal

  const fixDescription = description.replace(/\\n/g, '  \n')

  useEffect(() => {
    if(props.address !== props.wallet?.address && props.granters.includes(props.address)){
      setGranter(props.address)
    }
  }, [props.address]);

  useEffect(() => {
    if(granter){
      props.queryClient.getProposalVote(proposal_id, granter).then(result => {
        return setGranterVote(Vote(result.vote))
      }).catch(error => {
        setGranterVote(null)
      })
    }else{
      setGranterVote(null)
    }
  }, [granter]);

  function onVote(proposal, vote){
    if(granter && props.address !== granter){
      setGranterVote(vote)
    }else{
      props.onVote(proposal, vote)
    }
  }

  return (
    <>
      {error &&
        <AlertMessage variant="danger" className="text-break small">
          {error}
        </AlertMessage>
      }
      {proposal.isSpam &&
        <AlertMessage variant="danger" className="text-break small" dismissible={false}>
          This proposal appears to be spam - do not click any links!
        </AlertMessage>
      }
      <div className="row">
        <div className="col-12 col-lg-6">
          <Table>
            <tbody className="small">
              <tr>
                <td scope="row">ID</td>
                <td className="text-break">#{proposal_id}</td>
              </tr>
              <tr>
                <td scope="row">Status</td>
                <td>{proposal.statusHuman}</td>
              </tr>
              <tr>
                <td scope="row">Type</td>
                <td>{proposal.typeHuman}</td>
              </tr>
              {!proposal.isDeposit && (
                <>
                  <tr>
                    <td scope="row">Submit time</td>
                    <td>
                      <Moment format="LLL">
                        {proposal.submit_time}
                      </Moment>
                    </td>
                  </tr>
                  <tr>
                    <td scope="row">Voting end time</td>
                    <td>
                      <Moment format="LLL">
                        {proposal.voting_end_time}
                      </Moment>
                    </td>
                  </tr>
                </>
              )}
              {proposal.isDeposit && (
                <>
                  <tr>
                    <td scope="row">Deposit end time</td>
                    <td>
                      <Moment format="LLL">
                        {proposal.deposit_end_time}
                      </Moment>
                    </td>
                  </tr>
                  <tr>
                    <td scope="row">Total deposit</td>
                    <td>
                      {proposal.total_deposit.map(coins => {
                        return <Coins key={coins.denom} coins={coins} asset={network.baseAsset} />
                      })}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </Table>
        </div>
        {props.address && (
          <div className="col-12 col-lg-6">
            <p className="mb-2">
              {props.granters.length > 0 ? (
                <select className="form-select form-select-sm" aria-label="Granter" value={granter} onChange={(e) => setGranter(e.target.value)}>
                  <option value="">Your vote</option>
                  <optgroup label="Authz Grants">
                    {props.granters.map(granterAddress => {
                      const favourite = props.favouriteAddresses.find(el => el.address === granterAddress)
                      return <option key={granterAddress} value={granterAddress}>{favourite?.label || granterAddress}</option>
                    })}
                  </optgroup>
                </select>
              ) : (
                <strong>Your Vote</strong>
              )}
            </p>
            <VoteForm
              network={network}
              proposal={proposal}
              vote={granter ? granterVote : vote}
              address={props.address}
              wallet={props.wallet}
              granter={granter}
              signingClient={props.signingClient}
              onVote={onVote}
              setError={setError} />
          </div>
        )}
      </div>
      <div className="mb-4 mt-2">
        <ProposalProgress
          proposal={proposal}
          tally={tally}
          height={25} />
      </div>
      <div className="row mt-3">
        <div className="col">
          <h5 className="mb-3">{title}</h5>
          <ReactMarkdown
            children={fixDescription}
            remarkPlugins={[remarkGfm]}
            disallowedElements={proposal.isSpam && ['a']}
            unwrapDisallowed={true}
            components={{
              h1: 'h5',
              h2: 'h6',
              h3: 'h6',
              h4: 'h6',
              h5: 'h6',
              h6: 'h6',
              table: ({node, ...props}) => <table className="table" {...props} />
            }}
           />
        </div>
      </div>
    </>
  )
}

export default ProposalDetails
