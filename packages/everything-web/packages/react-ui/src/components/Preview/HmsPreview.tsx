import React from 'react';
import { usePreview } from '@100mslive/react-sdk';
import { Preview } from './Preview';
import { HmsPreviewTile } from './HmsPreviewTile';
import { Input, styled } from '../..';
import { Button } from '../Button';

export const HmsPreview = ({ token, name, setName, joinRoom }: any) => {
    const { localPeer } = usePreview(token, name);
    const error = name === '';
    return (
        <Preview.Page>
            <Preview.Container>
                {localPeer ? <HmsPreviewTile peer={localPeer} /> : null}
                <HiThere>Hi there</HiThere>
                <Name>What's your name?</Name>
                <Input error={error} value={name} onChange={(e) => setName(e.target.value)} />
                {error ? <Validation>Please enter name</Validation> : null}
                <Button disabled={error} onClick={joinRoom}>
                    Join
                </Button>
            </Preview.Container>
        </Preview.Page>
    );
};

const HiThere = styled('h2', {
    marginTop: '1rem',
    marginBottom: '0.5rem',
    color: 'White'
});

const Name = styled('h3', {
    marginTop: '0',
    marginBottom: '1rem',
    color: 'White'
});

const Validation = styled('p', {
    color: '$redMain'
});
