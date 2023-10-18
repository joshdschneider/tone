import { TONE_API_URL, TONE_INTERNAL_API_KEY } from '../utils/constants';

const BASE_URL = `${TONE_API_URL}/internal/actions`;

type ExecuteResponse = {
  success: true;
  data: any;
};

async function execute(id: string, args: any): Promise<ExecuteResponse> {
  console.log(args);
  const response = await fetch(`${BASE_URL}/${id}/execute`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TONE_INTERNAL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ args }),
  });

  const data = await response.json();
  return data;
}

export default { execute };
